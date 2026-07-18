# Parking Guard — Backend Business & API Contract

Tài liệu nghiệp vụ phía **app POS đang triển khai**, dùng cho team backend implement / align API.

- App: Expo RN, offline-first SQLite, session XState  
- API style: **raw JSON body** (không envelope `IBaseResponse`), Bearer JWT  
- Base URL: `EXPO_PUBLIC_API_BASE_URL`  
- Header token delivery login/refresh: `X-Token-Delivery: body`

---

## 1. Mô hình sản phẩm

### 1.1 Hai gói license

| | **Offline** | **Online** |
|--|-------------|------------|
| Kích hoạt | 1 mã (app mock: `OFF*` / `PG-OFF*`) | 1 mã khác |
| Auth NV | PIN local (SQLite `staff`) | Login server (SĐT/mã + PIN) |
| Config / bảng giá | **Sửa trên máy** | **Chỉ server đẩy xuống** — app **không** UI cấu hình, API ghi local bị chặn |
| Staff list | Local CRUD (admin) | Bootstrap từ server (login) |
| Sync giao dịch | Không cloud | Drive / pipeline sync (entries, monthly, lost) — **không** đồng nghĩa config |
| Ca (cash session) | Local SQLite | Prefer remote `cash-sessions` + mirror local |

### 1.2 Luồng app (happy path)

```
Splash / appMachine
  → chưa device     → Device Activation
  → device locked   → Device Locked (recheck / reset)
  → offline device  → Staff Login (local) → Open Shift → Gate tabs
  → online device   → Staff Login (API) + bootstrap → Open Shift → Gate tabs
```

Kết ca (`SHIFT_CLOSED`) / logout online → về staff login (giữ device).

### 1.3 Vai trò

| Role | App |
|------|-----|
| `admin` | Settings đầy đủ (offline: + cấu hình hệ thống), QL NV, lịch sử ca |
| `staff` | Gate + settings hạn chế (không config / không QL NV) |

---

## 2. API app đang gọi (real path)

Khi `EXPO_PUBLIC_USE_MOCK_AUTH=0|false`.

### 2.1 Device & Auth

| Method | Path | Body / notes | Response (app expect) |
|--------|------|--------------|------------------------|
| `POST` | `/v1/pos-devices/activate` | `{ activationCode: string }` | `DeviceInfo` |
| `POST` | `/v1/device/auth/login` | `{ deviceId, employeeCode, pin }` + header `X-Token-Delivery: body` | `LoginResponseData` |
| `POST` | `/v1/device/auth/refresh` | `{ refreshToken }` + cùng header | `{ accessToken, refreshToken }` |
| `POST` | `/v1/device/auth/logout` | `{ refreshToken }` | void (client ignore error) |
| `GET` | `/v1/device/auth/me` | Bearer | `Employee` |
| `GET` | `/v1/pos/device-context` | Bearer | `DeviceContextResponse` |

**Chưa có HTTP (cần backend):**

| Nhu cầu | Gợi ý path | Khi nào app dùng |
|---------|------------|------------------|
| Bootstrap offline seed | `GET/POST …/offline-bootstrap` hoặc gói kèm activate | Activate offline — hiện mock cứng |
| Pull config online sau login | `GET /v1/device/bootstrap` | Làm mới config; login nên **đã** nhúng `bootstrap` |

### 2.2 Cash sessions (ca)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/v1/cash-sessions?state={OPEN\|CLOSING\|RECONCILING}&posDeviceId=` | App thử lần lượt state |
| `POST` | `/v1/cash-sessions` | `{ posDeviceId, openingCash, notes? }` → `CashSession` |

Close shift hiện **local-first** (SQLite); remote close có thể bổ sung sau.

### 2.3 Types chính

```ts
type LicenseType = 'offline' | 'online'
type LicenseStatus = 'active' | 'expired' | 'revoked'

interface DeviceInfo {
  id: string
  deviceCode: string
  name: string
  lotName: string
  tenantId: string
  licenseType: LicenseType
  licenseStatus: LicenseStatus
  expiredAt: string        // ISO
  activatedAt: string      // ISO
  graceMinutes?: number    // online grace khi hết HSD / mất mạng (app dùng nếu có)
  isActive?: boolean
}

interface Employee {
  id: string
  employeeCode: string
  displayName: string
  role: 'admin' | 'staff' | string
  status: 'active' | string
}

interface LoginResponseData {
  accessToken: string
  refreshToken: string
  employee: Employee
  device: DeviceInfo
  bootstrap?: LocalBootstrap   // **bắt buộc cho online** nếu muốn máy có giá/config
}

interface DeviceContextResponse {
  deviceId: string
  deviceCode: string
  deviceName: string
  isActive: boolean            // false → app màn Device Locked
  licenseStatus: LicenseStatus
  expiredAt: string
}

interface LocalBootstrap {
  systemConfig?: Omit<SystemConfig, 'id'>
  pricingRules?: PricingRule[]   // 1 row / vehicleType
  staffList?: Staff[]            // offline + online seed
}

interface CashSession {
  id: string
  code?: string
  posDeviceId: string
  cashierUserId?: string
  state: 'OPEN' | 'CLOSED' | string
  openedAt: string
  openingCash: number
  version?: number
}
```

---

## 3. Bootstrap / cấu hình (quan trọng)

### 3.1 `systemConfig` (mirror SQLite `system_configs`)

| Field | Ý nghĩa | Default app |
|-------|---------|-------------|
| `lotName` | Tên bãi | — |
| `freeMinutes` | Phút miễn phí (lượt) | 15 |
| `lostCardFee` | Phụ thu mất thẻ (VND) | 50000 |
| `bankName` | NH VietQR | |
| `accountNumber` | STK | |
| `accountName` | Chủ TK (không dấu) | |
| `qrImageUrl` | Logo/QR phụ | null |
| `monthlyPriceMotorbike` | Giá tháng mặc định | 100000 |
| `monthlyPriceCar` | | 500000 |
| `monthlyPriceEbike` | | 100000 |
| `updatedAt` | timestamp | |

### 3.2 `pricingRules` — **schema phẳng mới** (1 row / loại xe)

```ts
interface PricingRule {
  id: string
  vehicleType: 'motorbike' | 'car' | 'ebike'  // unique
  dayPrice: number      // khung sáng 06:00–18:00
  nightPrice: number    // khung tối 18:00–06:00
  crossDayPrice: number | null  // null → dayPrice + nightPrice
}
```

**Backend / admin portal phải emit shape này.**  
Không còn: `timeType`, `firstHours`, `firstPrice`, `extraPerHour`, `maxPerDay`, overnight window fields.

Seed mẫu app (mock):

| vehicleType | dayPrice | nightPrice | crossDayPrice |
|-------------|----------|------------|---------------|
| motorbike | 5000 | 5000 | null |
| ebike | 5000 | 5000 | null |
| car | 20000 | 20000 | null |

### 3.3 Ai được ghi config trên device

| License | UI Settings “Cấu hình” | Ghi SQLite từ user | Ghi từ bootstrap server |
|---------|------------------------|--------------------|-------------------------|
| offline | Có | Có | Activate `getOfflineBootstrap` |
| online | **Ẩn** | **Chặn** (throw) | Login `bootstrap` (+ future pull) |

`applyLocalBootstrap`: upsert `system_configs` id=1; **delete-all + insert** `pricing_rules`; upsert `staff` theo id.

### 3.4 Offline bootstrap

- Activate offline → app gọi `AuthAPI.getOfflineBootstrap()` → hiện **mock only**.  
- **Cần BE:** endpoint trả `LocalBootstrap` theo mã kích hoạt / device (staff seed, giá, lot).

---

## 4. Nghiệp vụ cổng (local-first)

Toàn bộ IN/OUT ghi **SQLite**. Online sau đó sync bản ghi `synced=false` (Drive pipeline hiện tại — có thể thay API batch sau).

### 4.1 Thẻ NFC (`nfc_cards`)

| cardType | status thường gặp |
|----------|-------------------|
| `luot` | `free` → `using` (đang trong bãi) → `free` khi OUT |
| `thang` | `active` / `locked`; hết hạn app xử lý expired UI |

Fields: `uid`, `registeredPlate`, `expirationDate`, …

### 4.2 Lượt xe (`parking_entries`)

| status | Nghĩa |
|--------|--------|
| `IN` | Đang trong bãi |
| `OUT` | Đã ra, đã thu |
| `VOID` | Hủy |

**Vào (check-in)**  
- Bắt buộc: `entryShiftId`, `vehicleType`, `plateText`, `photoIn1` (full), `photoIn2` (crop biển), `entryTime`  
- `cardUid` optional (no-card)  
- Ảnh: nén full ~1280@0.7, crop ~640@0.8 rồi lưu permanent  

**Ra (check-out)**  
- `exitShiftId`, `exitPlate`, `photoOut1/2`, `feeAmount`, `paymentMethod` (`cash` \| `qr_transfer` \| `monthly`), `plateMatch`, optional mất thẻ  

**Ràng buộc nghiệp vụ app**  
- Biển đang `IN` → chặn vào trùng (đặc biệt no-card)  
- Ra có thẻ → tìm entry theo `cardUid` status IN  
- Ra no-card → search theo biển; nếu entry có `cardUid` → flow **mất thẻ**  
- Thẻ tháng còn hạn → `fee = 0`, `paymentMethod` có thể `monthly`  
- Thẻ tháng hết hạn → tính như lượt  

### 4.3 Công thức giá lượt (client — BE admin portal nên mirror)

```
m = phút(exit - entry)
freeMinutes, lostCardFee từ systemConfig
dayPrice, nightPrice, crossDayPrice từ pricingRules[vehicleType]

nếu thẻ tháng còn hạn → fee = 0
else nếu m < freeMinutes → fee = 0
else:
  dayDiff = số ngày lịch (local) exit - entry
  nếu dayDiff === 0:
    hour ∈ [6, 18) → fee = dayPrice
    else → fee = nightPrice          // theo GIỜ RA
  else:
    perCross = crossDayPrice ?? (dayPrice + nightPrice)
    fee = perCross * dayDiff

surcharge = isLostCard ? lostCardFee : 0
total = fee + surcharge
```

Ví dụ cùng ngày 10:00 → 20:00 → **nightPrice** (không cộng day+night).  
Qua 1 ngày lịch, `crossDayPrice = null` → day+night một lần.

### 4.4 Thẻ tháng (`monthly_subscriptions`)

- Đăng ký local: customer, plate, photos, `startDate`/`endDate`, `price`, `paymentMethod`, `shiftId`, `status`  
- Gia hạn: tạo bản ghi mới, cập nhật `nfc_cards.expirationDate`  
- Giá gợi ý UI: `systemConfig.monthlyPrice*`  

### 4.5 Mất thẻ (`lost_card_reports`)

- 1 report / entry  
- Ảnh người / xe / giấy tờ (nén doc)  
- `compensationFee` ≈ total (gồm phụ thu)  

### 4.6 Ca (`shifts` local)

- Open: `staffId`, `openingCash`, `startTime`, `status=open`  
- Close: đối soát tiền mặt / QR, `actualCash`, chênh lệch + lý do, `status=closed`  
- Online open prefer `POST /v1/cash-sessions`  

---

## 5. Session / bảo mật device (online)

App machine cold start (online):

1. `refresh(refreshToken)` — fail mạng: **không** logout; fail auth: clear session → login  
2. `getMe`  
3. `getDeviceContext` — `isActive === false` → màn khóa thiết bị  
4. Optional open cash session remote  

Silent 401 interceptor: refresh queue; refresh fail (non-network) → `TOKEN_EXPIRED`.

**Device locked:** user “Kiểm tra lại” → `getDeviceContext`; “Xóa kích hoạt” → clear local device (confirm).

---

## 6. Trách nhiệm Backend (checklist)

### Must-have online

- [ ] Activate trả đủ `DeviceInfo` (`licenseType: online`, HSD, lot, tenant)  
- [ ] Login trả tokens + employee + **device** + **`bootstrap` đầy đủ** (`systemConfig` + `pricingRules` shape mới + staff nếu cần)  
- [ ] Refresh token rotation  
- [ ] `device-context.isActive` / revoke  
- [ ] Cash sessions open + list open by `posDeviceId`  
- [ ] Admin portal: CRUD giá phẳng day/night/cross + system config → đẩy vào bootstrap  

### Must-have offline package

- [ ] Activate `licenseType: offline`  
- [ ] Endpoint / payload bootstrap offline (staff + config + pricing) — thay mock  
- [ ] Không bắt buộc JWT cho gate ops  

### Nice-to-have

- [ ] `GET /v1/device/bootstrap` pull config không cần re-login  
- [ ] Close cash session remote  
- [ ] Batch upload parking entries / monthly / lost (thay hoặc kèm Drive)  
- [ ] Webhook / version field trên bootstrap để app biết stale  

### Không làm trên mobile (online)

- UI/API cho user sửa `system_configs` / `pricing_rules`  
- Coi Drive sync là “cấu hình giá”  

---

## 7. Mock dev (app)

| | |
|--|--|
| Bật mock | default (`EXPO_PUBLIC_USE_MOCK_AUTH` khác `0`/`false`) |
| Offline code | `OFF-DEMO`, `OFF*`, `PG-OFF*` |
| Online code | `ON-DEMO` hoặc mã không prefix OFF |
| PIN mock | `1234` |
| Bootstrap | `MOCK_BOOTSTRAP` trong `auth.api.ts` |

---

## 8. File tham chiếu code app

| Chủ đề | Path |
|--------|------|
| Auth API | `src/shared/features/auth/api/auth.api.ts` |
| Types auth | `src/shared/features/auth/types/auth.api.types.ts` |
| Apply bootstrap | `src/shared/features/auth/services/apply-bootstrap.ts` |
| Device / license | `src/shared/features/app/types/device.types.ts`, `hooks/use-license.ts` |
| App machine | `src/shared/features/app/machines/app.machine.ts` |
| Pricing engine | `src/shared/features/gate/utils/pricing.util.ts` |
| Schema config | `src/shared/db/schemas/config.ts` |
| Gate write guard online | `src/shared/features/gate/apis/gate.api.ts` (`assertLocalConfigWritable`) |
| Cash remote | `src/shared/features/shift/apis/shift.remote.api.ts` |
| Plan auth/gate | `docs/plan-auth-axios-xstate-app-gate.md` |

---

*Cập nhật theo app Parking Guard AIDX — giá phẳng 2 khung + online config server-only.*
