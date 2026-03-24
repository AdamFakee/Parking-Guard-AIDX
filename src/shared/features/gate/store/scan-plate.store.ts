import { create } from 'zustand';

interface ScanPlateState {
  detectedPlate: string;
  confidence: number;
  isCorrected: boolean;
  isCapturing: boolean;
  capturedFull: string | null;
  capturedCrop: string | null;
  showModal: boolean;

  // Actions
  setDetectedPlate: (plate: string) => void;
  setConfidence: (conf: number) => void;
  setIsCorrected: (corrected: boolean) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCapturedFull: (uri: string | null) => void;
  setCapturedCrop: (uri: string | null) => void;
  setShowModal: (show: boolean) => void;
  reset: () => void;
}

export const useScanPlateStore = create<ScanPlateState>((set) => ({
  detectedPlate: '',
  confidence: 0,
  isCorrected: false,
  isCapturing: false,
  capturedFull: null,
  capturedCrop: null,
  showModal: false,

  setDetectedPlate: (plate) => set({ detectedPlate: plate }),
  setConfidence: (conf) => set({ confidence: conf }),
  setIsCorrected: (corrected) => set({ isCorrected: corrected }),
  setIsCapturing: (capturing) => set({ isCapturing: capturing }),
  setCapturedFull: (uri) => set({ capturedFull: uri }),
  setCapturedCrop: (uri) => set({ capturedCrop: uri }),
  setShowModal: (show) => set({ showModal: show }),
  reset: () =>
    set({
      detectedPlate: '',
      confidence: 0,
      isCorrected: false,
      capturedFull: null,
      capturedCrop: null,
      showModal: false,
    }),
}));
