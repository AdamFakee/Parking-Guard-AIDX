import { isOnlineLicense } from '@/shared/features/app/hooks/use-license'
import { useAppStore } from '@/shared/features/app/store/use-app-store'
import { db } from '@/shared/db'
import { lostCardReports, monthlySubscriptions, parkingEntries } from '@/shared/db/schemas'
import { and, eq, lt, or } from 'drizzle-orm'
import * as FileSystem from 'expo-file-system/legacy'
import { SYNC_CONFIG, generateFileName } from '../config'
import { useSyncStore } from '../store/use-sync-store'
import { imageToBase64 } from '../utils/image-helpers'

class SyncManager {
  private isSyncing = false

  /** Chỉ gói online mới sync cloud. Offline = no-op. */
  public async startSync() {
    const device = useAppStore.getState().appService?.getSnapshot().context.device
    if (!isOnlineLicense(device)) return

    if (this.isSyncing) return
    this.isSyncing = true
    useSyncStore.getState().setSyncing(true);
    try {
      await this.syncParkingEntries();
      await this.syncMonthlySubscriptions();
      await this.syncLostCardReports();
      useSyncStore.getState().setLastSyncTime(new Date());
    } catch (error) {
      console.error('Lỗi tổng quát trong quá trình đồng bộ:', error);
    } finally {
      this.isSyncing = false;
      useSyncStore.getState().setSyncing(false);
    }
  }

  private async syncParkingEntries() {
    const pending = await db.query.parkingEntries.findMany({
      where: and(
        eq(parkingEntries.synced, false),
        lt(parkingEntries.syncAttempts, SYNC_CONFIG.MAX_RETRIES)
      ),
      limit: SYNC_CONFIG.BATCH_SIZE,
    });

    if (pending.length === 0) return;

    const batchData = await Promise.all(
      pending.map(async (entry) => {
        const photos: Record<string, string | null> = {};
        
        // Chuyển đổi các ảnh sang Base64
        if (entry.photoIn1) photos.photoIn1 = await imageToBase64(entry.photoIn1);
        if (entry.photoIn2) photos.photoIn2 = await imageToBase64(entry.photoIn2);
        if (entry.photoOut1) photos.photoOut1 = await imageToBase64(entry.photoOut1);
        if (entry.photoOut2) photos.photoOut2 = await imageToBase64(entry.photoOut2);

        return {
          ...entry,
          photos,
        };
      })
    );

    const success = await this.uploadToDrive('PARKING_LOGS', batchData);

    if (success) {
      const ids = pending.map((p) => p.id);
      await db.update(parkingEntries)
        .set({ synced: true })
        .where(or(...ids.map(id => eq(parkingEntries.id, id))));
    } else {
      for (const entry of pending) {
        await db.update(parkingEntries)
          .set({ syncAttempts: (entry.syncAttempts || 0) + 1 })
          .where(eq(parkingEntries.id, entry.id));
      }
    }
  }

  private async syncMonthlySubscriptions() {
    const pending = await db.query.monthlySubscriptions.findMany({
      where: and(
        eq(monthlySubscriptions.synced, false),
        lt(monthlySubscriptions.syncAttempts, SYNC_CONFIG.MAX_RETRIES)
      ),
      limit: SYNC_CONFIG.BATCH_SIZE,
    });

    if (pending.length === 0) return;

    const batchData = await Promise.all(
      pending.map(async (sub) => {
        const photos: Record<string, string | null> = {};
        if (sub.photoProfile) photos.photoProfile = await imageToBase64(sub.photoProfile);
        if (sub.photoVehicle) photos.photoVehicle = await imageToBase64(sub.photoVehicle);

        return {
          ...sub,
          photos,
        };
      })
    );

    const success = await this.uploadToDrive('MONTHLY_SUBS', batchData);

    if (success) {
      const ids = pending.map((p) => p.id);
      await db.update(monthlySubscriptions)
        .set({ synced: true })
        .where(or(...ids.map(id => eq(monthlySubscriptions.id, id))));
    } else {
      for (const record of pending) {
        await db.update(monthlySubscriptions)
          .set({ syncAttempts: (record.syncAttempts || 0) + 1 })
          .where(eq(monthlySubscriptions.id, record.id));
      }
    }
  }

  private async syncLostCardReports() {
    const pending = await db.query.lostCardReports.findMany({
      where: and(
        eq(lostCardReports.synced, false),
        lt(lostCardReports.syncAttempts, SYNC_CONFIG.MAX_RETRIES)
      ),
      limit: SYNC_CONFIG.BATCH_SIZE,
    });

    if (pending.length === 0) return;

    const batchData = await Promise.all(
      pending.map(async (report) => {
        const photos: Record<string, string | null> = {};
        if (report.photoVehicle) photos.photoVehicle = await imageToBase64(report.photoVehicle);
        if (report.photoPerson) photos.photoPerson = await imageToBase64(report.photoPerson);
        if (report.photoDocument) photos.photoDocument = await imageToBase64(report.photoDocument);

        return {
          ...report,
          photos,
        };
      })
    );

    const success = await this.uploadToDrive('LOST_CARDS', batchData);

    if (success) {
      const ids = pending.map((p) => p.id);
      await db.update(lostCardReports)
        .set({ synced: true })
        .where(or(...ids.map(id => eq(lostCardReports.id, id))));
    } else {
      for (const record of pending) {
        await db.update(lostCardReports)
          .set({ syncAttempts: (record.syncAttempts || 0) + 1 })
          .where(eq(lostCardReports.id, record.id));
      }
    }
  }

  private async uploadToDrive(prefix: string, data: any[]): Promise<boolean> {
    const fileName = generateFileName(prefix, data.length);
    const jsonString = JSON.stringify(data);
    
    try {
      const base64Content = await this.encodeStringToBase64(jsonString);
      
      const response = await fetch(SYNC_CONFIG.DRIVE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          base64: base64Content,
        }),
      });

      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error(`❌ Lỗi upload batch ${prefix}:`, error);
      return false;
    }
  }

  private async encodeStringToBase64(str: string): Promise<string> {
    const tempFile = `${FileSystem.cacheDirectory}sync_temp_${Date.now()}.json`;
    try {
      await FileSystem.writeAsStringAsync(tempFile, str, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const base64 = await FileSystem.readAsStringAsync(tempFile, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } finally {
      await FileSystem.deleteAsync(tempFile, { idempotent: true });
    }
  }
}

export const syncManager = new SyncManager();
