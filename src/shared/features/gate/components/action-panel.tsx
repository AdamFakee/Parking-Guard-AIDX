import { COLORS } from '@/shared/constants/color.const';
import React, { memo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScanPlateStore } from '../store';

interface ActionPanelProps {
  onCapture: () => void;
  onConfirm?: () => void;
}

/**
 * Nút chụp tròn giữa đáy — safe area bottom.
 */
export const ActionPanel = memo(({ onCapture }: ActionPanelProps) => {
  const { isCapturing } = useScanPlateStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 12) + 16,
        zIndex: 20,
      }}
    >
      <Pressable
        onPress={onCapture}
        disabled={isCapturing}
        accessibilityRole="button"
        accessibilityLabel="Chụp ảnh"
        hitSlop={{ top: 28, bottom: 28, left: 28, right: 28 }}
        style={{ opacity: isCapturing ? 0.65 : 1 }}
      >
        {/* Vòng ngoài */}
        <View
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            borderWidth: 4,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isCapturing ? (
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: 'rgba(255,255,255,0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator color={COLORS.brand.blue} />
            </View>
          ) : (
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: '#FFFFFF',
              }}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
});

ActionPanel.displayName = 'ActionPanel';
