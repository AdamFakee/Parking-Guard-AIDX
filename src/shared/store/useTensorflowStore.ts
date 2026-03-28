import { create } from 'zustand';
import { Platform } from 'react-native';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

export type TModelStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface TensorflowState {
  model: TensorflowModel | null;
  status: TModelStatus;
  error: string | null;
  
  // Actions
  loadModel: () => Promise<void>;
  resetModel: () => void;
}

export const useTensorflowStore = create<TensorflowState>((set, get) => ({
  model: null,
  status: 'idle',
  error: null,

  loadModel: async () => {
    // Nếu đã đang load hoặc đã load xong thì không làm gì
    if (get().status === 'loading' || get().status === 'loaded') return;

    set({ status: 'loading', error: null });

    try {
      const delegate = Platform.OS === 'ios' ? 'core-ml' : 'android-gpu';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const model = await loadTensorflowModel(
        require('@/assets/models/best_int8.tflite'),
        delegate
      );
      
      set({ model, status: 'loaded' });
    } catch (e) {
      console.error('[TensorflowStore] Failed to load model:', e);
      set({ 
        status: 'error', 
        error: e instanceof Error ? e.message : 'Unknown error loading model' 
      });
    }
  },

  resetModel: () => {
    set({ model: null, status: 'idle', error: null });
  },
}));
