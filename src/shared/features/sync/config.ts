import Constants from 'expo-constants';

export const SYNC_CONFIG = {
  // Google Apps Script URL 
  DRIVE_URL: 'https://script.google.com/macros/s/AKfycbwC7XhLkMLtad61oQd90IfeaMOtgZAVx-A_WplTfaBPACMraphJ7AVnc2dKx0ahYXkLaQ/exec',
  
  // Batch settings
  BATCH_SIZE: 10, // Số bản ghi mỗi batch
  MAX_RETRIES: 3, // Số lần retry tối đa
  TIMEOUT_MS: 45000, // 45 giây timeout cho upload ảnh
  
  // Background sync interval (phút)
  BG_SYNC_INTERVAL: 15,
};

// Lấy tên thiết bị để định danh trong file name
export const getDeviceId = () => {
  return (Constants.deviceName || 'UNKNOWN_DEVICE').replace(/[^a-zA-Z0-9]/g, '_');
};

// Tạo tên file đồng bộ
export const generateFileName = (prefix: string, count: number) => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-T:]/g, '')
    .split('.')[0];
  const deviceId = getDeviceId();
  
  return `${prefix}_${deviceId}_${timestamp}_${count}.json`;
};
