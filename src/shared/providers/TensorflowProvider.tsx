// src/shared/providers/TensorflowProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';

// Type helper to get the exact return type of the hook
type ModelLoadResult = ReturnType<typeof useTensorflowModel>;

const TensorflowContext = createContext<ModelLoadResult | null>(null);

export function TensorflowProvider({ children }: { children: ReactNode }) {
  const delegate = Platform.OS === 'ios' ? 'core-ml' : 'android-gpu';
  
  const tfModel = useTensorflowModel(
    require('@/assets/models/best_int8.tflite'),
    delegate
  );

  return (
    <TensorflowContext.Provider value={tfModel}>
      {children}
    </TensorflowContext.Provider>
  );
}

export function useTensorflow() {
  const context = useContext(TensorflowContext);
  if (!context) {
    throw new Error('useTensorflow must be used within a TensorflowProvider');
  }
  return context;
}
