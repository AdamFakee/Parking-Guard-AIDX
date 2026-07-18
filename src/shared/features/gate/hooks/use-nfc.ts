import { useCallback, useState } from 'react';
import { nfcService, StartListeningOpts } from '../services/nfc.service';

export const useNfc = () => {
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readTag = useCallback(async () => {
    setIsReading(true);
    setError(null);
    try {
      const tag = await nfcService.readTag();
      setIsReading(false);
      return tag;
    } catch (err: any) {
      setError(err?.message || 'Lỗi đọc thẻ NFC');
      setIsReading(false);
      return null;
    }
  }, []);

  const cancelRead = useCallback(async () => {
    await nfcService.stop();
    setIsReading(false);
  }, []);

  const startListening = useCallback(
    async (onTagFound: (tag: any) => void, opts?: StartListeningOpts) => {
      setError(null);
      setIsReading(true);
      const result = await nfcService.startListening((tag) => {
        onTagFound(tag);
      }, opts);
      if (!result?.ok) {
        setIsReading(false);
        setError(result?.reason || 'NFC không khả dụng');
        return result;
      }
      // keep isReading true = "listening" for UI
      return result;
    },
    []
  );

  const stopListening = useCallback(async () => {
    await nfcService.stopListening();
    setIsReading(false);
  }, []);

  return {
    readTag,
    cancelRead,
    startListening,
    stopListening,
    isReading,
    error,
  };
};
