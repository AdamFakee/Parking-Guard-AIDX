import { Button } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { X } from 'lucide-react-native';
import React, { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MAX_PLATE_CHARS } from '../const/parking.const';
import { PlateForm, PlateSchema } from '../schemas';
import { useScanPlateStore } from '../store';
import { cleanPlateInput, formatDisplayPlate } from '../utils';

export interface ErrorModalRef {
  open: () => void;
  close: () => void;
}

interface ErrorModalProps {
  onConfirm: () => void;
}

/**
 * Popup giữa màn — bấm nền ngoài = dismiss.
 */
export const ErrorModal = memo(
  forwardRef<ErrorModalRef, ErrorModalProps>(({ onConfirm }, ref) => {
    const [visible, setVisible] = useState(false);
    const [ocrTooLong, setOcrTooLong] = useState(false);

    const { detectedPlate, capturedCrop: plateImage, capturedFull, setDetectedPlate } =
      useScanPlateStore();

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<PlateForm>({
      resolver: valibotResolver(PlateSchema),
      defaultValues: { value: '' },
    });

    useImperativeHandle(ref, () => ({
      open: () => {
        const current = cleanPlateInput(
          useScanPlateStore.getState().detectedPlate,
          99
        );
        setOcrTooLong(current.length > MAX_PLATE_CHARS);
        reset({ value: current.slice(0, MAX_PLATE_CHARS) });
        setVisible(true);
      },
      close: () => setVisible(false),
    }));

    const handleClose = () => setVisible(false);

    const handleConfirm = (data: { value: string }) => {
      setDetectedPlate(cleanPlateInput(data.value, MAX_PLATE_CHARS));
      setVisible(false);
      onConfirm();
    };

    const previewUri = plateImage || capturedFull;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {/* Nền dismiss — layout cố định, keyboard không lift cả màn */}
        <View className="flex-1 bg-black/55 justify-center px-6">
          <Pressable className="absolute inset-0" onPress={handleClose} />
          <View
            className="w-full max-w-md self-center bg-white rounded-3xl overflow-hidden border border-slate-100"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
              maxHeight: '80%',
            }}
          >
            <KeyboardAwareScrollView
              bottomOffset={20}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardDismissMode="interactive"
            >
              <View>
                <View className="flex-row items-start justify-between px-5 pt-5 pb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-xl font-black text-slate-900 tracking-tight">
                      Hiệu chỉnh biển số
                    </Text>
                    <Text className="text-slate-400 text-sm mt-1 leading-5">
                      AI có thể đọc sai — sửa lại cho đúng
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleClose}
                    className="size-9 rounded-full bg-slate-100 items-center justify-center"
                    hitSlop={8}
                  >
                    <X size={18} color={COLORS.slate[500]} />
                  </Pressable>
                </View>

                <View className="px-5 pb-5">
                  <View className="h-28 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 mb-5">
                    {previewUri ? (
                      <Image
                        source={{ uri: previewUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Text className="text-slate-400 text-xs">Không có ảnh biển</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Biển số
                  </Text>
                  {detectedPlate ? (
                    <Text
                      className={`text-xs mb-2 ${
                        cleanPlateInput(detectedPlate, 99).length > MAX_PLATE_CHARS
                          ? 'text-brand-red'
                          : 'text-slate-400'
                      }`}
                    >
                      AI: {formatDisplayPlate(cleanPlateInput(detectedPlate, MAX_PLATE_CHARS))}
                      {cleanPlateInput(detectedPlate, 99).length > MAX_PLATE_CHARS
                        ? '… (quá dài)'
                        : ''}
                    </Text>
                  ) : null}

                  <Controller
                    control={control}
                    name="value"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <TextInput
                          value={formatDisplayPlate(value)}
                          onChangeText={(val) => {
                            setOcrTooLong(false);
                            onChange(cleanPlateInput(val, MAX_PLATE_CHARS));
                          }}
                          maxLength={MAX_PLATE_CHARS + 2}
                          placeholder="xx-xx-xxxx"
                          placeholderTextColor={COLORS.slate[400]}
                          autoFocus
                          autoCapitalize="characters"
                          className={`bg-slate-50 rounded-2xl px-4 py-4 text-2xl font-black text-slate-900 font-mono text-center tracking-widest border ${
                            errors.value || ocrTooLong ? 'border-brand-red' : 'border-slate-200'
                          }`}
                          style={{
                            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          }}
                        />
                        {errors.value ? (
                          <Text className="text-brand-red text-xs mt-2 text-center">
                            {errors.value.message}
                          </Text>
                        ) : ocrTooLong ? (
                          <Text className="text-brand-red text-xs mt-2 text-center">
                            OCR quá dài — kiểm tra lại biển
                          </Text>
                        ) : null}
                      </>
                    )}
                  />

                  <Button
                    label="XÁC NHẬN"
                    onPress={handleSubmit(handleConfirm)}
                    className="h-14 mt-5 bg-brand-blue border-0 rounded-2xl"
                    textClassName="text-white font-black text-base"
                  />
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    );
  })
);

ErrorModal.displayName = 'ErrorModal';
