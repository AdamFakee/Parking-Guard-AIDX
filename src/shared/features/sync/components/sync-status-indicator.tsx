import React, { useEffect } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncManager } from '../services/sync-manager';

/**
 * Component "tàng hình" để quản lý việc kích hoạt đồng bộ dữ liệu.
 * Nó sẽ tự động start sync khi app mount và định kỳ khi có kết nối mạng.
 */
export const SyncStatusIndicator = () => {
  useEffect(() => {
    // 1. Chạy sync ngay khi app mở
    const initialSync = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable) {
        await syncManager.startSync();
      }
    };
    
    initialSync();

    // 2. Theo dõi thay đổi mạng để sync khi có mạng lại
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        syncManager.startSync();
      }
    });

    // 3. Sync định kỳ (ví dụ mỗi 10 phút)
    const intervalId = setInterval(() => {
      syncManager.startSync();
    }, 10 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  // Component không hiển thị gì cả để không ảnh hưởng UI
  return <View style={{ width: 0, height: 0, opacity: 0 }} />;
};
