import { Platform } from 'react-native';
import NfcManager, {
  NfcAdapter,
  NfcEvents,
  NfcTech,
  TagEvent,
} from 'react-native-nfc-manager';

export type StartListeningOpts = {
  /** Android: reader mode — cần khi camera cũng bật (cổng scan). */
  withCamera?: boolean;
};

export class NfcService {
  private static instance: NfcService;
  private isSupported = false;
  private isListening = false;
  private initPromise: Promise<void>;

  private constructor() {
    this.initPromise = this.init();
  }

  public static getInstance(): NfcService {
    if (!this.instance) {
      this.instance = new NfcService();
    }
    return this.instance;
  }

  private async init() {
    try {
      this.isSupported = await NfcManager.isSupported();
      if (this.isSupported) {
        await NfcManager.start();
      }
    } catch (e) {
      console.warn('NFC initialization failed', e);
      this.isSupported = false;
    }
  }

  public async ensureReady(): Promise<{ ok: boolean; reason?: string }> {
    await this.initPromise;
    if (!this.isSupported) {
      return { ok: false, reason: 'Thiết bị không hỗ trợ NFC' };
    }
    try {
      const enabled = await NfcManager.isEnabled();
      if (!enabled) {
        return { ok: false, reason: 'NFC đang tắt — bật NFC trong Cài đặt máy' };
      }
    } catch {
      /* some devices throw — still try */
    }
    return { ok: true };
  }

  /** Normalize tag id → hex string (handles string | number[] | bytes). */
  public static tagId(tag: TagEvent | null | undefined): string {
    if (!tag) return '';
    const raw = tag.id as unknown;
    if (typeof raw === 'string' && raw.length > 0) return raw.toUpperCase();
    if (Array.isArray(raw)) {
      return raw
        .map((b) => Number(b).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
    if (raw && typeof raw === 'object' && ArrayBuffer.isView(raw)) {
      return Array.from(raw as Uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
    // Some firmwares put id only on tech
    const anyTag = tag as any;
    if (typeof anyTag?.ndefMessage === 'object' && anyTag?.id == null && anyTag?.techTypes) {
      // no id — still empty
    }
    return '';
  }

  public async readTag() {
    try {
      await this.ensureReady();
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
      return await NfcManager.getTag();
    } catch (ex) {
      console.warn('NFC Read Error', ex);
      return null;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {
        /* ignore */
      }
    }
  }

  public async stop() {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      /* ignore */
    }
  }

  /**
   * Background tag discovery.
   * withCamera=true → Android Reader Mode so NFC works while VisionCamera is open.
   */
  public async startListening(
    callback: (tag: TagEvent) => void,
    opts: StartListeningOpts = {}
  ) {
    await this.initPromise;
    const ready = await this.ensureReady();
    if (!ready.ok) {
      console.warn('[NFC]', ready.reason);
      return ready;
    }

    await this.stopListening();

    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
        try {
          callback(tag);
        } catch (e) {
          console.warn('[NFC] callback error', e);
        }
      });

      const registerOpts: {
        alertMessage: string;
        invalidateAfterFirstRead: boolean;
        isReaderModeEnabled?: boolean;
        readerModeFlags?: number;
        readerModeDelay?: number;
      } = {
        alertMessage: 'Chạm thẻ NFC vào máy',
        invalidateAfterFirstRead: false,
      };

      // Camera + NFC: must use reader mode on Android
      if (Platform.OS === 'android' && opts.withCamera) {
        registerOpts.isReaderModeEnabled = true;
        registerOpts.readerModeFlags =
          NfcAdapter.FLAG_READER_NFC_A |
          NfcAdapter.FLAG_READER_NFC_B |
          NfcAdapter.FLAG_READER_NFC_F |
          NfcAdapter.FLAG_READER_NFC_V |
          NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK |
          NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS;
        registerOpts.readerModeDelay = 250;
      }

      await NfcManager.registerTagEvent(registerOpts);

      this.isListening = true;
      return { ok: true as const };
    } catch (e) {
      console.warn('NFC Register Tag Error', e);
      this.isListening = false;
      return { ok: false as const, reason: 'Không bật được chế độ đọc NFC' };
    }
  }

  public async stopListening() {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      try {
        await NfcManager.unregisterTagEvent();
      } catch {
        /* not registered */
      }
    } catch (e) {
      console.warn('NFC Unregister Tag', e);
    } finally {
      this.isListening = false;
    }
  }
}

export const nfcService = NfcService.getInstance();
