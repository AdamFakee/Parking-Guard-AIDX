import Toast, { ToastShowParams } from 'react-native-toast-message'

/**
 * Quản lý hàng đợi hiển thị Toast.
 * Giúp hiển thị các Toast lần lượt, tránh việc Toast mới đè lên Toast cũ quá nhanh.
 */
class ToastQueueManager {
  /** Hàng đợi lưu trữ các config của Toast cần hiển thị */
  private queue: ToastShowParams[] = []

  /** Trạng thái cho biết có Toast nào đang hiển thị hay không */
  private isShowing = false

  /**
   * Thêm một Toast vào hàng đợi và bắt đầu xử lý nếu đang rảnh.
   * @param params - Các tham số cấu hình cho Toast (type, text1, text2, visibilityTime, etc.)
   */
  show(params: ToastShowParams) {
    this.queue.push(params)
    this.processQueue()
  }

  /**
   * Xử lý hàng đợi: Lấy Toast tiếp theo và hiển thị.
   * Nếu đang có Toast hiển thị hoặc hàng đợi rỗng, sẽ dừng lại.
   */
  private processQueue() {
    if (this.isShowing || this.queue.length === 0) {
      return
    }

    this.isShowing = true
    const nextToast = this.queue.shift()

    if (nextToast) {
      Toast.show({
        ...nextToast,
        onHide: () => {
          this.isShowing = false
          // Gọi callback gốc nếu có
          if (nextToast.onHide) {
            nextToast.onHide()
          }
          // Xử lý cái tiếp theo sau một khoảng delay nhỏ để tạo hiệu ứng mượt
          setTimeout(() => {
            this.processQueue()
          }, 300)
        },
      })
    }
  }
}

/**
 * Instance duy nhất của ToastQueueManager để sử dụng trong toàn bộ ứng dụng.
 * @example
 * toastQueue.show({ type: 'success', text1: 'Thành công' });
 */
export const toastQueue = new ToastQueueManager()
