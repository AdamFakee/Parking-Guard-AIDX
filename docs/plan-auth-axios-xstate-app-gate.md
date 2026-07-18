# Plan: Axios + XState v5 Auth + App Gate + useAppParams

## Context

Plan chi tiết để setup / port / harden stack auth POS từ **kích hoạt app → login NV → mở ca**:

1. **Axios API** — client, interceptor, auth/shift endpoints
2. **XState v5 appMachine** — session truth + persist
3. **useAppInit + useAppGate** — boot + navigation guard
4. **useAppParams + ROUTES** — type-safe route params

Repo reference: `d:\souvenir` (Expo RN, xstate ^5.31, axios, expo-router, MMKV, Zustand). Có thể port sang source khác theo cùng contract.

---

# 1. Axios API

## 1.1 Cấu trúc file

```
src/shared/lib/axios/
  axios.service.ts      # singleton client
  axios.interceptor.ts  # Bearer + silent refresh
  axios.client.ts       # export instance
  index.ts

src/shared/features/auth/api/
  auth.api.ts           # activate/login/refresh/logout/me/device-context

src/shared/features/shift/api/remote/
  shift.remote.api.ts   # cash-sessions
```

## 1.2 AxiosService (singleton)

```ts
class AxiosService {
  private static instance: AxiosService
  private axiosInstance: AxiosInstance
  readonly baseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api-wms-dev.aidx.vn'

  constructor() {
    this.axiosInstance = setupInterceptorsTo(
      create({
        baseURL: this.baseUrl,
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }

  static getInstance(): AxiosService { /* singleton */ }
  getAxiosInstance(): AxiosInstance
  get/post/put/patch/delete<T>(path, ...)
}
```

**Rules:**
- 1 instance toàn app
- Timeout 30s
- Base URL env-overridable, fallback dev
- Method generic `<T>` → caller nhận `response.data` typed
- **API v1.8 = raw JSON body**, không unwrap `IBaseResponse` envelope

## 1.3 Interceptors

### Request
```
accessToken = appService.getSnapshot().context.accessToken
headers.Authorization = accessToken ? `Bearer ${accessToken}` : ''
headers.Content-Type = application/json
```

### Response error — silent refresh (401)

```
if status !== 401 → reject
if url includes '/auth/refresh' → reject (tránh loop)
if originalRequest._retry already → TOKEN_EXPIRED + toast + reject
if no refreshToken in storage → TOKEN_EXPIRED + toast + reject

if isRefreshing:
  queue request → khi xong gắn Bearer mới → retry

else:
  isRefreshing = true
  originalRequest._retry = true
  AuthAPI.refresh(refreshToken)
  on success:
    save new refreshToken (rotation)
    send ACCESS_TOKEN_REFRESHED { accessToken }
    processQueue(null, newAccessToken)
    retry original
  on fail:
    processQueue(error, null)
    if network error (no response): toast, KHÔNG logout
    else: TOKEN_EXPIRED + toast + reject
  finally: isRefreshing = false
```

**Lazy require** appStore + AuthAPI trong interceptor để tránh circular import lúc module load.

**Storage key refresh:** `auth-refresh-token` (tách khỏi blob session).

## 1.4 AuthAPI contract

Header bắt buộc body-delivery (RN):

```ts
const BODY_DELIVERY_HEADER = { 'X-Token-Delivery': 'body' } as const
```

| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| `activateDevice` | `POST /v1/pos-devices/activate` | anon | `{ deviceCode, activationToken }` | `DeviceInfo` |
| `login` | `POST /v1/device/auth/login` | anon + body header | `{ deviceId, employeeCode, pin }` | `{ accessToken, refreshToken, employee, device }` |
| `refresh` | `POST /v1/device/auth/refresh` | anon + body header | `{ refreshToken }` | `{ accessToken, refreshToken }` (rotation) |
| `logout` | `POST /v1/device/auth/logout` | body header | `{ refreshToken }` | void (fire-and-forget, catch nuốt) |
| `getMe` | `GET /v1/device/auth/me` | Bearer | — | `Employee` |
| `getDeviceContext` | `GET /v1/pos/device-context` | Bearer | — | `{ deviceId, deviceCode, deviceName, warehouseId, isActive }` |

```ts
// pattern
const axios = AxiosService.getInstance()
const res = await axios.post<LoginResponseData>(
  '/v1/device/auth/login',
  data,
  { headers: BODY_DELIVERY_HEADER },
)
return res.data
```

**Lỗi server (UI map):** `error.response?.data` dạng `{ error: string }` hoặc `{ message }` → toast / setError field.

## 1.5 ShiftRemoteAPI contract (auth path cần)

| Method | Endpoint | Notes |
|--------|----------|-------|
| `getOpenSessions(posDeviceId)` | `GET /v1/cash-sessions?state=OPEN\|CLOSING\|RECONCILING&posDeviceId=` | thử lần lượt state; fail → `[]` |
| `openShift` | `POST /v1/cash-sessions` | body `{ posDeviceId, openingCash, notes? }` → `CashSession` |
| `getShiftById` | `GET /v1/cash-sessions/{id}` | unwrap `{ session }` nếu BE bọc |
| `closeShift` | `POST /v1/cash-sessions/{id}/transitions` | unwrap `StateResponse.data` |
| `getZReport` | `GET /v1/cash-sessions/{id}/z-report` | sau đóng ca |

`CashSession` tối thiểu: `id`, `code`, `posDeviceId`, `cashierUserId`, `state`, `openedAt`, `openingCash`, `version`.

## 1.6 Types dùng chung auth

```ts
interface DeviceInfo {
  id: string
  deviceCode: string
  name: string
  deviceType: string
  location: string
  tenantId: string
  warehouseId?: string
  status?: string
}

interface Employee {
  id: string
  email: string
  employeeCode: string
  displayName: string
  status: string
  roles: EmployeeRole[]
  permissions: EmployeePermission[] // pos:checkout | pos:refund | print:shift
}
```

## 1.7 Quy tắc Axios khi port source khác

1. Object export `AuthAPI` / `ShiftRemoteAPI`, không class service rời lẻ per-endpoint
2. Path prefix `/v1/...` (không `/api/v1`)
3. Bearer chỉ qua interceptor — caller không gắn token tay
4. Anonymous auth endpoints: thêm `X-Token-Delivery: body`
5. Auth side-effect **không** React Query — direct async + machine
6. 401 refresh queue 1 lần; network fail khi refresh **không** logout

## 1.8 Verification Axios

- [ ] Request có Bearer khi machine có accessToken
- [ ] Login/refresh response có `refreshToken` trong body (header body-delivery)
- [ ] 2 request 401 đồng thời → chỉ 1 refresh, cả 2 retry OK
- [ ] Refresh 401 → TOKEN_EXPIRED, queue wiped
- [ ] Refresh network error → giữ session, toast mạng
- [ ] activate/login không cần Bearer

---

# 2. XState v5 appMachine

## 2.1 File

```
src/shared/features/app/
  machines/app.machine.ts
  store/use-app-store.ts
  types/app.types.ts
  hooks/use-app-context.ts
  index.ts
```

Deps: `xstate@5`, `@xstate/react`, zustand, storage (MMKV hoặc tương đương).

## 2.2 Context & Events

```ts
interface AppContext {
  device: DeviceInfo | null
  accessToken: string | null
  employee: Employee | null
  cashSessionId: string | null
  paymentMethods: PaymentMethodConfig[] | null
  tenantConfig: TenantConfig | null
  terminalConfig: TerminalConfig | null
  error: string | null
}

type AppEvent =
  | { type: 'DEVICE_ACTIVATED'; device: DeviceInfo }
  | { type: 'LOGIN_SUCCESS'; accessToken: string; employee: Employee; device: DeviceInfo }
  | { type: 'SHIFT_OPENED'; cashSessionId: string }
  | { type: 'SHIFT_CLOSED' }
  | { type: 'LOGGED_OUT' }
  | { type: 'TOKEN_EXPIRED' }
  | { type: 'DEVICE_RESET' }
  | { type: 'DEVICE_UNLOCKED' }
  | { type: 'PAYMENT_METHODS_UPDATED'; paymentMethods: PaymentMethodConfig[] }
  | { type: 'ACCESS_TOKEN_REFRESHED'; accessToken: string }
  | { type: 'NETWORK_RESTORED' }
```

**Persist blob** (`app-machine-persist`): device, paymentMethods, tenantConfig, terminalConfig, accessToken, employee, cashSessionId.

**Không persist trong blob:** refreshToken (key `auth-refresh-token`), error.

## 2.3 State chart

```
id: app
initial: initializing

initializing
  always:
    - guard hasDevice → refreshingAuth
    - → deviceInactive

refreshingAuth
  invoke: refreshAuthFlow
  onDone:
    - cashSessionId != null → shiftOpen  (+ assign token/employee/session/device.warehouse/payments)
    - → noShift (+ assign..., cashSessionId null)
  onError:
    - isDeviceInactive → deviceLockedByServer
    - isNetworkError → restoreOffline   // KHÔNG clearAuth
    - → unauthenticated + clearAuth

restoreOffline
  always:
    - hasCachedSession → shiftOpen
    - → noShift

deviceInactive
  on DEVICE_ACTIVATED → unauthenticated + saveDevice

unauthenticated
  on LOGIN_SUCCESS → revalidatingShift + saveAuth
  on DEVICE_RESET → deviceInactive + resetDevice

revalidatingShift
  invoke: revalidateShiftFlow
  onDone:
    - session → shiftOpen
    - → noShift
  onError:
    - DEVICE_INACTIVE → deviceLockedByServer
    - → noShift  // network: không block user

deviceLockedByServer
  on DEVICE_UNLOCKED → refreshingAuth

noShift
  on SHIFT_OPENED → shiftOpen + saveShift
  on LOGGED_OUT | TOKEN_EXPIRED → unauthenticated + clearAuth
  on NETWORK_RESTORED → refreshingAuth

shiftOpen
  on SHIFT_CLOSED → noShift + clearShift
  on LOGGED_OUT | TOKEN_EXPIRED → unauthenticated + clearAuth
  on NETWORK_RESTORED → refreshingAuth

// global on (mọi state):
PAYMENT_METHODS_UPDATED → assign methods + derive tenant/terminal từ qr_bidv / card_bidv
ACCESS_TOKEN_REFRESHED → assign accessToken only
```

## 2.4 Actors (`fromPromise`)

### refreshAuthFlow
**input:** `{ deviceId, refreshToken, onTokenRotated }`

```
1. if !refreshToken → throw (→ unauthenticated)
2. AuthAPI.refresh(refreshToken) → { accessToken, refreshToken }
3. onTokenRotated(newRefresh)  // ghi storage ngay
4. employee = AuthAPI.getMe()
5. deviceContext = AuthAPI.getDeviceContext()
   - nếu isActive === false → throw code DEVICE_INACTIVE
   - network fail ở bước này → bỏ qua (không lock)
6. sessions = ShiftRemoteAPI.getOpenSessions(deviceId)
   cashSessionId = sessions[0]?.id ?? null
7. paymentMethods = PaymentRemoteAPI.getPaymentMethods() (optional catch)
8. SyncService.pullMasterData() fire-and-forget
return { accessToken, employee, cashSessionId, paymentMethods, warehouseId }
```

### revalidateShiftFlow
**input:** `{ deviceId }`

```
1. getDeviceContext (same inactive/network rules)
2. getOpenSessions → cashSessionId
3. payment methods optional
4. pull master fire-and-forget
return { cashSessionId, paymentMethods, warehouseId }
```

## 2.5 Actions

| Action | Behavior |
|--------|----------|
| `saveDevice` | `device = event.device`, clear error |
| `saveAuth` | accessToken, employee; merge device, **giữ warehouseId** cũ nếu login không trả |
| `saveShift` | `cashSessionId = event.cashSessionId` |
| `clearShift` | `cashSessionId = null` |
| `clearAuth` | wipe refresh storage + `accessToken/employee = null` |
| `resetDevice` | wipe refresh + full DEFAULT_CONTEXT |

## 2.6 Guards

```ts
hasDevice: context.device !== null
isNetworkError: AxiosError && !error.response
isDeviceInactive: error?.code === 'DEVICE_INACTIVE'
hasCachedSession: context.cashSessionId !== null
```

## 2.7 Store pattern

```ts
useAppStore = create({
  appService: null,
  initApp() {
    if (appService) return // singleton
    persisted = loadFromStorage()
    service = createActor(appMachine, { input: persisted }).start()
    service.subscribe(state => saveToStorage(state.context))
    set({ appService: service })
  },
  destroyApp() { stop + null },
  getRefreshToken / saveRefreshToken / clearRefreshToken
})
```

**Login screen bắt buộc:**
```
saveRefreshToken(response.refreshToken)  // TRƯỚC
appService.send({ type: 'LOGIN_SUCCESS', ... })
```

## 2.8 useAppContext

```ts
useSelector(appService, s => s?.context) ?? DEFAULT_CONTEXT
useHasPermission(p) => employee.permissions.includes(p)
```

## 2.9 Verification machine

- [ ] No device boot → deviceInactive
- [ ] Device + valid refresh → shiftOpen hoặc noShift
- [ ] Device + expired refresh → unauthenticated, token wiped
- [ ] Device + offline → restoreOffline, token giữ
- [ ] Login → revalidatingShift → đúng nhánh ca
- [ ] SHIFT_OPENED / CLOSED / LOGGED_OUT transitions đúng
- [ ] ACCESS_TOKEN_REFRESHED không đổi state value
- [ ] warehouseId không mất sau login

---

# 3. useAppInit + useAppGate + Routes

## 3.1 useAppInit

```ts
useEffect(() => {
  // optional: sync i18n từ settings
  useAppStore.getState().initApp()
  // optional: initPos(), connection listeners
  return () => {
    useAppStore.getState().destroyApp()
    // cleanup pos + connection
  }
}, [])
```

Gọi **1 lần** trong root layout, bên trong providers (DB/Query nếu có).

## 3.2 useAppGate — chi tiết

```ts
const appService = useAppStore(s => s.appService)
const stateValue = useSelector(appService ?? undefined, s => s?.value)
const router = useRouter()
const segments = useSegments()
const rootNavigationState = useRootNavigationState()

const segment0 = segments[0] // group: '(auth)' | '(tab)' | 'exchange'
const segment1 = segments[1] // screen trong group

useEffect(() => {
  if (!rootNavigationState?.key) return  // nav chưa ready
  if (!appService) return                // machine chưa start

  const inTabGroup = segment0 === '(tab)'
  const inExchange = segment0 === 'exchange'

  switch (stateValue) {
    case 'deviceInactive':
      if (segment1 !== 'device-activation')
        router.replace(ROUTES.DEVICE_ACTIVATION.path())
      break
    case 'deviceLockedByServer':
      if (segment1 !== 'device-locked')
        router.replace(ROUTES.DEVICE_LOCKED.path())
      break
    case 'unauthenticated':
      if (segment1 !== 'staff-login')
        router.replace(ROUTES.STAFF_LOGIN.path())
      break
    case 'noShift':
      if (segment1 !== 'open-shift')
        router.replace(ROUTES.OPEN_SHIFT.path())
      break
    case 'shiftOpen':
      // cho phép toàn bộ tab + exchange full-screen
      if (!inTabGroup && !inExchange)
        router.replace(ROUTES.POS.path())
      break
    // initializing | refreshingAuth | revalidatingShift | restoreOffline:
    //   KHÔNG redirect — giữ splash/index
  }
}, [stateValue, segment0, segment1, rootNavigationState?.key, appService, router])
```

**Rules gate:**
1. Chỉ `replace`, không `push` (tránh back vào màn auth)
2. So `segment1` cho auth screens (vì group `(auth)` là `segment0`)
3. `shiftOpen` whitelist: `(tab)/*` + top-level `exchange`
4. Transient states: no-op → user thấy `index` spinner
5. Screens **không** `router.*` sau success — chỉ send event; gate điều hướng
6. Exception chấp nhận: open-shift thiếu employee → defensive replace login

## 3.3 Root layout wire

```tsx
function AppBootstrapper() {
  useAppInit()
  useAppGate()
  return null
}

// Stack:
//   index          — splash/loading
//   (auth)         — activation | locked | login | open-shift
//   (tab)          — pos | orders | dashboard | ...
//   exchange       — full-screen, param orderId
```

## 3.4 Auth layout

```tsx
// (auth)/_layout.tsx — khai báo ĐỦ 4 màn
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="device-activation" />
  <Stack.Screen name="device-locked" />
  <Stack.Screen name="staff-login" />
  <Stack.Screen name="open-shift" />
</Stack>
```

## 3.5 Screen ↔ event matrix

| Screen | Success path | Fail path |
|--------|--------------|-----------|
| **device-activation** | `AuthAPI.activateDevice` → `DEVICE_ACTIVATED` | toast + field error |
| **staff-login** | `AuthAPI.login` → `saveRefreshToken` → `LOGIN_SUCCESS` | toast + pin error |
| **open-shift** | `openStaffShift({ posDeviceId, openingBalance })` → API open → `SHIFT_OPENED` | toast |
| **open-shift logout** | `AuthAPI.logout(rt)` fire-forget → `LOGGED_OUT` | — |
| **device-locked** | `getDeviceContext` active → `DEVICE_UNLOCKED` | toast vẫn khóa / mạng |
| **index** | spinner only | — |

### Open shift hook

```ts
openStaffShift({ posDeviceId, openingBalance }) {
  session = ShiftRemoteAPI.openShift({
    posDeviceId,
    openingCash: openingBalance,  // map tên field
  })
  pullMasterData optional
  appService.send({ type: 'SHIFT_OPENED', cashSessionId: session.id })
}
```

UI: opening cash > 0; confirm dialog trước khi gọi.

### Login form validation

```ts
// shared schema — khớp API, không username/password legacy
{
  employeeCode: string min 1
  pin: string length 4  // hoặc rule BE thực tế
}
```

## 3.6 NETWORK_RESTORED

```ts
// connection store / NetInfo listener
on online transition (không phải initial check):
  appService?.send({ type: 'NETWORK_RESTORED' })
  // optional: drain offline outbox
```

Chỉ có ý nghĩa khi đang `noShift` | `shiftOpen` (sau restoreOffline). Machine ignore nếu state khác không khai báo event (hoặc khai báo no-op).

## 3.7 ROUTES constant

```ts
export const ROUTES = {
  DEVICE_ACTIVATION: { path: () => '/(auth)/device-activation', params: {} as never },
  DEVICE_LOCKED:     { path: () => '/(auth)/device-locked',     params: {} as never },
  STAFF_LOGIN:       { path: () => '/(auth)/staff-login',       params: {} as never },
  OPEN_SHIFT:        { path: () => '/(auth)/open-shift',        params: {} as never },
  POS:               { path: () => '/(tab)/pos',                params: {} as never },
  ORDERS:            { path: () => '/(tab)/orders',             params: {} as never },
  DASHBOARD:         { path: () => '/(tab)/dashboard',          params: {} as never },
  EXCHANGE: {
    path: (orderId: string) =>
      ({ pathname: '/exchange', params: { orderId } }) as Href,
    params: {} as { orderId: string },
  },
} as const

export type RouteName = keyof typeof ROUTES
export type RouteParamsMap = {
  [K in RouteName]: (typeof ROUTES)[K] extends { params: infer P } ? P : never
}
```

**Gate và mọi redirect auth chỉ dùng `ROUTES.*.path()`** — không hardcode string rải rác.

## 3.8 Verification gate

- [ ] Cold start no device → activation (không flash tab)
- [ ] Từng state terminal → đúng 1 screen, không loop replace
- [ ] shiftOpen vào orders/dashboard OK; deep link lạ → POS
- [ ] exchange khi shiftOpen không bị kick
- [ ] refreshingAuth giữ splash
- [ ] Logout từ open-shift → staff-login
- [ ] Auth layout 4 screens mở được

---

# 4. useAppParams

## 4.1 Hook

```ts
// src/shared/hooks/use-app-params.ts
import { useLocalSearchParams } from 'expo-router'
import type { RouteParamsMap } from '../constants/routes.const'

/**
 * Type-safe route params theo RouteParamsMap.
 * @param _route key ROUTES — chỉ để TS suy params; runtime không dùng
 */
export function useAppParams<K extends keyof RouteParamsMap>(_route?: K) {
  return useLocalSearchParams<RouteParamsMap[K]>()
}
```

Export từ `src/shared/hooks/index.ts`.

## 4.2 Quy tắc dùng

| Tình huống | Cách |
|------------|------|
| Route **có** params (EXCHANGE) | `const { orderId } = useAppParams('EXCHANGE')` |
| Route **không** params (auth, tabs) | không cần hook; navigate `ROUTES.X.path()` |
| Thêm route mới có params | 1) thêm entry `ROUTES` với `params` type + `path(args)` 2) screen dùng `useAppParams('NAME')` 3) nếu full-screen ngoài tab → cập nhật whitelist gate |
| Navigate có params | **luôn** `ROUTES.EXCHANGE.path(orderId)` — không tự ghép query string |
| Đọc params | **luôn** `useAppParams` — không `useLocalSearchParams` raw (trừ case đặc biệt ngoài ROUTES) |

## 4.3 Consumer mẫu — exchange

```ts
// navigate
router.push(ROUTES.EXCHANGE.path(order.id))

// screen
export default function ExchangeScreen() {
  const { orderId } = useAppParams('EXCHANGE')
  // orderId: string (theo RouteParamsMap['EXCHANGE'])
  ...
}
```

## 4.4 Mở rộng params sau này (template)

```ts
// ví dụ order detail
ORDER_DETAIL: {
  path: (id: string) => ({ pathname: '/(tab)/orders/[id]', params: { id } }),
  params: {} as { id: string },
}

// screen
const { id } = useAppParams('ORDER_DETAIL')
```

Auth routes cố ý `params: {} as never` — không invent param thừa.

## 4.5 Gate interaction với params

- Gate **không** đọc params; chỉ segments + machine state
- Route có params nằm ngoài `(tab)` (như `exchange`) phải được **whitelist** trong nhánh `shiftOpen`
- Khi thêm full-screen mới: sửa `useAppGate` case `shiftOpen`

## 4.6 Verification params

- [ ] `useAppParams('EXCHANGE')` type có `orderId: string`
- [ ] `useAppParams('POS')` type `never` / empty — TS báo nếu destructure field ảo
- [ ] Mở exchange từ orders → đúng orderId; reload/back không mất guard
- [ ] Không còn `useLocalSearchParams` ad-hoc cho route đã khai báo trong ROUTES

---

# 5. End-to-end sequence

```
App launch
  → AppBootstrapper: useAppInit + useAppGate
  → initApp: MMKV → createActor.start → refreshingAuth | deviceInactive
  → index splash cho tới terminal state
  → gate replace đúng màn

[deviceInactive]
  user nhập deviceCode + activationToken
  → AuthAPI.activateDevice
  → DEVICE_ACTIVATED
  → unauthenticated → gate → staff-login

[unauthenticated]
  user nhập employeeCode + pin
  → AuthAPI.login (+ X-Token-Delivery: body)
  → saveRefreshToken(refresh)
  → LOGIN_SUCCESS
  → revalidatingShift
  → noShift | shiftOpen | deviceLockedByServer

[noShift]
  user nhập opening cash > 0, confirm
  → POST /v1/cash-sessions { posDeviceId, openingCash }
  → SHIFT_OPENED { cashSessionId }
  → shiftOpen → gate → POS

[shiftOpen]
  bán hàng / orders / exchange(orderId via useAppParams)
  đóng ca → SHIFT_CLOSED → noShift
  logout → LOGGED_OUT → unauthenticated (+ logout API + wipe refresh)

[401 anytime]
  interceptor refresh queue
  → ACCESS_TOKEN_REFRESHED | TOKEN_EXPIRED

[offline boot]
  restoreOffline → cached shiftOpen|noShift
  network up → NETWORK_RESTORED → refreshingAuth
```

---

# 6. Implementation order

| # | Work | Deliverable |
|---|------|-------------|
| 1 | Types Device/Employee/AppContext/AppEvent | `app.types.ts` |
| 2 | AxiosService + interceptors | `lib/axios/*` |
| 3 | AuthAPI + ShiftRemoteAPI (open/list) | feature api |
| 4 | appMachine + actors/guards/actions | `app.machine.ts` |
| 5 | useAppStore persist + refresh helpers | `use-app-store.ts` |
| 6 | ROUTES + RouteParamsMap + useAppParams | constants + hooks |
| 7 | useAppInit + useAppGate | hooks |
| 8 | Root + auth layout + index splash | app routes |
| 9 | 4 auth screens + open-shift hook | screens |
| 10 | NetInfo → NETWORK_RESTORED | connection store |
| 11 | Exchange adopt useAppParams + gate whitelist | exchange |
| 12 | Manual E2E checklist | — |

---

# 7. Critical files (souvenir reference)

| Path | Role |
|------|------|
| `src/shared/lib/axios/axios.service.ts` | client |
| `src/shared/lib/axios/axios.interceptor.ts` | 401 refresh |
| `src/shared/features/auth/api/auth.api.ts` | auth endpoints |
| `src/shared/features/shift/api/remote/shift.remote.api.ts` | sessions |
| `src/shared/features/app/machines/app.machine.ts` | FSM |
| `src/shared/features/app/store/use-app-store.ts` | actor + MMKV |
| `src/shared/features/app/types/app.types.ts` | types |
| `src/shared/features/app/hooks/use-app-context.ts` | selectors |
| `src/shared/hooks/use-app-init.ts` | boot |
| `src/shared/hooks/use-app-gate.ts` | guard |
| `src/shared/hooks/use-app-params.ts` | typed params |
| `src/shared/constants/routes.const.ts` | ROUTES map |
| `src/app/_layout.tsx` | wire init+gate |
| `src/app/(auth)/_layout.tsx` | 4 screens |
| `src/app/(auth)/*.tsx` | UI events |
| `src/app/exchange.tsx` | useAppParams consumer |
| `src/shared/store/use-connection-store.ts` | NETWORK_RESTORED |

---

# 8. Out of scope

- SecureStore thay MMKV (ponytail: khi compliance bắt buộc)
- Rewrite full `docs/api/staff.md|shift.md` (stale)
- Payment/order machines
- React Query cho login/activate
- Tab `/(tab)/shift` nếu chưa có product screen

---

# 9. Full verification checklist

**Axios**
- [ ] Bearer gắn đúng; body-delivery login/refresh
- [ ] Silent refresh queue; rotation; network vs auth fail

**Machine**
- [ ] 5 terminal states + transient boot
- [ ] Persist/restore; refresh token tách key
- [ ] warehouseId preserve; DEVICE_INACTIVE lock

**Gate**
- [ ] Map state→route 1-1; no loop; splash khi transient
- [ ] shiftOpen: tabs + exchange OK

**Params**
- [ ] ROUTES single source; useAppParams('EXCHANGE') typed
- [ ] Navigate chỉ qua ROUTES.path

**E2E**
- [ ] activation → login → open shift → POS
- [ ] cold restart / offline restore / logout / 401 / device lock
