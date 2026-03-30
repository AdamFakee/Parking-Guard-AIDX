# 🅿️ Parking Guard AIDX — Giải pháp Quản lý Bãi xe Thông minh

> [!IMPORTANT]
> **Kích hoạt & Đăng nhập:**
> - Nhập **SĐT bất kỳ** & Mật khẩu **1234** để kích hoạt ứng dụng.
> - Mã Passcode mặc định cho nhân viên cũng là **1234**.

**Parking Guard AIDX** là ứng dụng di động chuyên dụng dành cho nhân viên vận hành bãi giữ xe. Ứng dụng tích hợp công nghệ **NFC** (quẹt thẻ) và **ALPR** (tự động nhận dạng biển số) giúp tối ưu hóa quy trình kiểm soát, giảm thiểu sai sót và hiện đại hóa trải nghiệm khách gửi xe.

---

## 📋 Mục lục
1. [Bắt đầu ca trực](#1-bắt-đầu-ca-trực)
2. [Kiểm soát xe vào (Check-in)](#2-kiểm-soát-xe-vào-check-in)
3. [Kiểm soát xe ra (Check-out)](#3-kiểm-soát-xe-ra-check-out)
4. [Xử lý trường hợp đặc biệt (Mất thẻ / Không thẻ)](#4-xử-lý-trường-hợp-đặc-biệt)
5. [Đăng ký & Gia hạn thẻ tháng](#5-đăng-ký--gia-hạn-thẻ-tháng)
6. [Quản lý trong bãi & Báo cáo](#6-quản-lý-trong-bãi--báo-cáo)
7. [Cấu hình hệ thống](#7-cấu-hình-hệ-thống)

---

## 1. Bắt đầu ca trực
- **Đăng nhập:** Truy cập bằng tài khoản nhân viên đã được cấp.
- **Mở ca:** Hệ thống sẽ ghi nhận nhân viên trực hiện tại, thời gian bắt đầu và các số liệu doanh thu/lượt xe riêng biệt cho ca đó.
- **Giao diện chính (Dashboard):** Hiển thị tổng quan số xe đang trong bãi, lượt vào/ra trong ca và tổng doanh thu hiện tại.

## 2. Kiểm soát xe vào (Check-in)
Quy trình thực hiện khi có xe vào bãi:
1. **Chạm thẻ NFC:** Chạm thẻ gửi xe vào vùng đọc NFC của thiết bị. Ứng dụng sẽ tự động chuyển đến màn hình chụp ảnh.
2. **Nhận dạng biển số:** Camera sẽ tự động quét và nhận diện biển số xe.
3. **Xác nhận:**
   - Kiểm tra biển số hiển thị trên màn hình có khớp với biển số thực tế.
   - Chọn loại phương tiện (Ô tô, Xe máy...).
   - Nhấn **"XÁC NHẬN XE VÀO"**.
   - Nếu là thẻ tháng đã đăng ký biển số, hệ thống sẽ tự động đối soát và thông báo nếu đúng xe.

## 3. Kiểm soát xe ra (Check-out)
Quy trình thực hiện khi xe ra khỏi bãi:
1. **Quét thẻ:** Chạm thẻ khách đưa vào thiết bị.
2. **Đối soát dữ liệu:**
   - Màn hình hiển thị ảnh xe lúc vào và ảnh hiện tại.
   - Hệ thống so sánh biển số lúc vào và lúc ra. Nếu không khớp, nhân viên cần nhập lý do (ví dụ: xe mượn thẻ, nhận diện sai...).
3. **Thanh toán:**
   - Hệ thống tự động tính phí dựa trên thời gian gửi và biểu phí quy định.
   - **Thẻ tháng:** Nếu thẻ còn hạn, chi phí sẽ là 0đ.
   - **Thẻ lượt:** Chọn hình thức thanh toán **Tiền mặt** hoặc **Chuyển khoản (VietQR)**.
4. **Hoàn tất:** Nhấn **"XÁC NHẬN XE RA"** sau khi đã nhận đủ tiền.

## 4. Xử lý trường hợp đặc biệt
### 🔍 Tìm xe trong bãi
Nếu khách không có thẻ hoặc quên vị trí, nhấn **"Tìm xe trong bãi"** trên Dashboard hoặc màn hình Check-out để tìm theo biển số xe.

### ⚠️ Xử lý mất thẻ
1. Vào chức năng **Tìm xe trong bãi** và chọn xe tương ứng.
2. Tại màn hình tính tiền, hệ thống sẽ tự động cộng thêm **Phí mất thẻ** theo cấu hình.
3. Chụp ảnh CMND/CCCD hoặc giấy tờ liên quan (nếu cần) và xác nhận cho xe ra.

## 5. Đăng ký & Gia hạn thẻ tháng
### Đăng ký mới
- Chọn **"Đăng ký thẻ tháng"** trên Dashboard.
- Nhập thông tin khách hàng, số điện thoại và biển số xe đăng ký.
- Chạm thẻ NFC trống để gán ID.
- Chọn gói cước (Tháng, Quý...) và nhấn lưu.

### Gia hạn thẻ
- Khi quẹt thẻ tháng đã hết hạn, hệ thống sẽ hiển thị thông báo.
- Nhân viên có thể chọn **Gia hạn nhanh** ngay tại chỗ hoặc yêu cầu khách đăng ký lại.

## 6. Quản lý trong bãi & Báo cáo
- **Danh sách xe:** Xem toàn bộ xe đang gửi, thời gian vào của từng xe.
- **Lịch sử lượt xe:** Tra cứu các lượt xe đã ra/vào trước đó.
- **Báo cáo doanh thu:** Xem chi tiết doanh thu theo tiền mặt, chuyển khoản và theo từng thời điểm trong ca.

## 7. Cấu hình hệ thống
- **Máy in:** Kết nối máy in Bluetooth để in hóa đơn thanh toán cho khách.
- **Tài khoản VietQR:** Cấu hình mã QR ngân hàng để khách quét mã thanh khoản nhanh chóng.
- **Biểu phí:** Thiết lập giá vé lượt, vé tháng và phí mất thẻ.

---

## 🛠 Thông tin Kỹ thuật (Technical Detail)

### Tech Stack
- **Framework:** Expo (React Native)
- **Architecture:** Feature-Based Architecture
- **State Management:** Zustand & TanStack Query
- **Styling:** NativeWind (Tailwind CSS)
- **Scanner:** NFC Nitro & custom ALPR module

### Cài đặt Môi trường
```bash
# Cài đặt thư viện
npm install

# Chạy ở chế độ phát triển
npx expo start --localhost

# Build ứng dụng (Android)
npx expo run:android
```

---
*© 2026 Parking Guard AIDX - Phát triển bởi AdamFakee.*
