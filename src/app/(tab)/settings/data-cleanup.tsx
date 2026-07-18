import { AppHeader, Button, Card } from '@/shared/components/ui'
import { COLORS } from '@/shared/constants'
import { useLicense } from '@/shared/features/app'
import {
  CLEANUP_DAY_OPTIONS,
  formatBytes,
  getStorageOverview,
  previewDataCleanup,
  runDataCleanup,
  totalCleanupItems,
  totalUnsynced,
  type CleanupDays,
  type CleanupPreview,
  type StorageOverview,
} from '@/shared/features/sync/services/data-cleanup.service'
import { syncManager } from '@/shared/features/sync/services/sync-manager'
import { useSyncStore } from '@/shared/features/sync/store/use-sync-store'
import { toast } from '@/shared/store/use-alert-store'
import { toastQueue } from '@/shared/utils/toast.util'
import NetInfo from '@react-native-community/netinfo'
import { useFocusEffect } from 'expo-router'
import { HardDrive, Trash2 } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'

export default function DataCleanupScreen() {
  const { isOffline: isOfflineLicense } = useLicense()
  const { isSyncing } = useSyncStore()
  const [overview, setOverview] = useState<StorageOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState<CleanupDays>(30)
  const [preview, setPreview] = useState<CleanupPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [running, setRunning] = useState(false)

  const loadOverview = useCallback(async () => {
    try {
      const o = await getStorageOverview()
      setOverview(o)
    } catch (e) {
      toastQueue.show({
        type: 'error',
        text1: 'Không đọc được dung lượng',
        text2: e instanceof Error ? e.message : 'Thử lại sau',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPreview = useCallback(async (days: CleanupDays) => {
    setPreviewing(true)
    try {
      setPreview(await previewDataCleanup(days))
    } catch (e) {
      setPreview(null)
      toastQueue.show({
        type: 'error',
        text1: 'Không xem trước được',
        text2: e instanceof Error ? e.message : 'Lỗi dọn dữ liệu',
      })
    } finally {
      setPreviewing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadOverview()
      void loadPreview(selectedDays)
    }, [loadOverview, loadPreview, selectedDays]),
  )

  const onSelectDays = (days: CleanupDays) => {
    setSelectedDays(days)
    void loadPreview(days)
  }

  const runManualSync = async () => {
    if (isOfflineLicense) return
    const state = await NetInfo.fetch()
    if (!state.isConnected) {
      toastQueue.show({
        type: 'warning',
        text1: 'Không có mạng',
        text2: 'Kiểm tra kết nối trước khi đồng bộ.',
      })
      return
    }
    try {
      await syncManager.startSync()
      toastQueue.show({
        type: 'success',
        text1: 'Đã đồng bộ',
        text2: 'Có thể dọn an toàn hơn.',
      })
      void loadPreview(selectedDays)
    } catch {
      toastQueue.show({
        type: 'error',
        text1: 'Đồng bộ thất bại',
        text2: 'Thử lại sau.',
      })
    }
  }

  const onCleanup = () => {
    if (!preview || running) return
    const total = totalCleanupItems(preview)
    if (total === 0) {
      toastQueue.show({
        type: 'info',
        text1: 'Không có gì để xóa',
        text2: `Không có mục cũ hơn ${selectedDays} ngày.`,
      })
      return
    }

    if (overview && !overview.worthCleaning) {
      toast.confirm({
        title: 'Dữ liệu còn ít',
        message: `Ảnh ~${formatBytes(overview.imageBytes)}, ${overview.totalRecords} bản ghi. Dọn lúc này ít lợi — vẫn muốn xóa ${total} mục cũ hơn ${selectedDays} ngày?`,
        confirmLabel: 'Vẫn dọn',
        destructive: true,
        onConfirm: () => confirmDelete(preview),
      })
      return
    }

    confirmDelete(preview)
  }

  const confirmDelete = (p: CleanupPreview) => {
    const total = totalCleanupItems(p)
    const unsynced = !isOfflineLicense ? totalUnsynced(p) : 0
    const body =
      (unsynced > 0
        ? `⚠ ${unsynced} mục chưa sync — xóa sẽ mất trên máy.\nNên đồng bộ trước.\n\n`
        : '') +
      `Sẽ xóa trước ${p.cutoff.toLocaleDateString('vi-VN')}:\n` +
      `• ${p.entries} lượt xe\n` +
      `• ${p.closedShifts} ca đã đóng\n` +
      `• ${p.monthly} đăng ký tháng\n` +
      `• ${p.lostReports} biên bản mất thẻ\n\n` +
      `Giữ xe trong bãi / ca đang mở.` +
      (unsynced > 0 ? '\n\nMuốn backup: Hủy → Đồng bộ trước.' : '')

    toast.confirm({
      title: `Dọn ${p.days} ngày (${total} mục)`,
      message: body,
      confirmLabel: unsynced > 0 ? 'Vẫn xóa' : 'Xóa',
      destructive: true,
      onConfirm: () => void executeCleanup(p.days),
    })
  }

  const executeCleanup = async (days: CleanupDays) => {
    setRunning(true)
    try {
      const result = await runDataCleanup(days)
      const n =
        result.deletedEntries +
        result.deletedShifts +
        result.deletedMonthly +
        result.deletedLostReports
      toastQueue.show({
        type: 'success',
        text1: 'Đã dọn dữ liệu',
        text2: `Xóa ${n} mục cũ hơn ${days} ngày.`,
      })
      await loadOverview()
      await loadPreview(days)
    } catch (e) {
      toastQueue.show({
        type: 'error',
        text1: 'Dọn thất bại',
        text2: e instanceof Error ? e.message : 'Không xóa được',
      })
    } finally {
      setRunning(false)
    }
  }

  const total = preview ? totalCleanupItems(preview) : 0
  const unsynced = preview && !isOfflineLicense ? totalUnsynced(preview) : 0

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Dọn dữ liệu cũ" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true)
              void loadOverview()
              void loadPreview(selectedDays)
            }}
          />
        }
      >
        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="size-11 rounded-full bg-blue-50 border border-blue-100 items-center justify-center">
              <HardDrive size={20} color={COLORS.brand.blue} />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Dung lượng ảnh local
              </Text>
              {loading && !overview ? (
                <ActivityIndicator color={COLORS.brand.blue} className="mt-1 self-start" />
              ) : (
                <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatBytes(overview?.imageBytes ?? 0)}
                </Text>
              )}
            </View>
          </View>

          {overview ? (
            <View className="rounded-xl bg-slate-50 border border-slate-100 p-3 gap-1.5">
              <Row label="Lượt xe" value={`${overview.entryCount}`} />
              <Row label="Ca đã đóng" value={`${overview.closedShiftCount}`} />
              <Row label="Đăng ký tháng" value={`${overview.monthlyCount}`} />
              <Row label="Biên bản mất thẻ" value={`${overview.lostCount}`} />
              <View className="h-px bg-slate-200 my-1" />
              <Row label="Tổng bản ghi" value={`${overview.totalRecords}`} bold />
            </View>
          ) : null}

          {overview && !overview.worthCleaning ? (
            <View className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
              <Text className="text-sm font-semibold text-amber-800 leading-5">
                Dữ liệu còn ít — chưa cần dọn. Xóa lúc này gần như không giải phóng gì đáng kể.
              </Text>
            </View>
          ) : overview?.worthCleaning ? (
            <Text className="text-xs text-slate-500 leading-5">
              Ảnh và lịch sử đã tích lũy. Có thể xóa mục cũ hơn N ngày (giữ xe trong bãi + ca mở).
            </Text>
          ) : null}
        </Card>

        <Card title="Chọn mốc xóa" className="gap-3">
          <Text className="text-xs text-slate-500 leading-5">
            Xóa lịch sử tạo trước N ngày.
            {!isOfflineLicense
              ? ' Online: cảnh báo nếu còn mục chưa sync.'
              : ' Offline: xóa vĩnh viễn trên máy.'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CLEANUP_DAY_OPTIONS.map((days) => {
              const active = selectedDays === days
              return (
                <Pressable
                  key={days}
                  onPress={() => onSelectDays(days)}
                  disabled={running}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Chọn ${days} ngày`}
                  hitSlop={6}
                  className={`min-w-[30%] flex-1 min-h-14 px-3 rounded-xl border items-center justify-center ${
                    active
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-white'
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                >
                  <Text
                    className={`text-base font-bold ${
                      active ? 'text-red-500' : 'text-slate-700'
                    }`}
                  >
                    {days} ngày
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Card>

        <Card
          title="Xem trước"
          titleRight={
            previewing ? <ActivityIndicator size="small" color={COLORS.brand.blue} /> : null
          }
          className="gap-2"
        >
          {preview && !previewing ? (
            <>
              <Row label="Lượt xe" value={`${preview.entries}`} />
              <Row label="Ca đã đóng" value={`${preview.closedShifts}`} />
              <Row label="Đăng ký tháng" value={`${preview.monthly}`} />
              <Row label="Biên bản mất thẻ" value={`${preview.lostReports}`} />
              <View className="h-px bg-slate-100 my-1" />
              <Row label="Sẽ xóa" value={`${total} mục`} bold />
              {unsynced > 0 ? (
                <Text className="text-xs font-semibold text-amber-600 mt-1">
                  ⚠ {unsynced} mục chưa sync
                </Text>
              ) : null}
              {total === 0 ? (
                <Text className="text-xs text-slate-500 mt-1">
                  Không có mục cũ hơn {selectedDays} ngày — chọn mốc khác hoặc bỏ qua.
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-sm text-slate-400">Đang tính…</Text>
          )}
        </Card>

        {!isOfflineLicense && unsynced > 0 ? (
          <Button
            label={isSyncing ? 'Đang đồng bộ…' : 'Đồng bộ trước khi xóa'}
            variant="outline"
            loading={isSyncing}
            disabled={isSyncing || running}
            onPress={() => void runManualSync()}
            className="h-14 rounded-xl border-slate-200 bg-white px-6"
            textClassName="text-base font-bold text-slate-700"
          />
        ) : null}

        <Button
          label={running ? 'Đang dọn…' : `Dọn dữ liệu (${selectedDays} ngày)`}
          loading={running}
          disabled={running || previewing || total === 0}
          leftIcon={Trash2}
          onPress={onCleanup}
          className="h-14 rounded-xl px-6 bg-brand-red border-brand-red"
          textClassName="text-base font-bold"
        />
      </ScrollView>
    </View>
  )
}

function Row({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}
      >
        {value}
      </Text>
    </View>
  )
}
