import NfcManager, { NfcTech, NfcEvents, TagEvent } from 'react-native-nfc-manager';

class NfcService {
  private static instance: NfcService;
  private isSupported: boolean = false;

  private constructor() {
    this.init();
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
    }
  }

  public async readTag() {
    try {
      // iOS and Android handle this slightly differently
      // Request technology
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA]);
      const tag = await NfcManager.getTag();
      return tag;
    } catch (ex) {
      console.warn('NFC Read Error', ex);
      return null;
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  public async stop() {
    NfcManager.cancelTechnologyRequest();
  }

  public async startListening(callback: (tag: TagEvent) => void) {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
        callback(tag);
      });
      await NfcManager.registerTagEvent();
    } catch (e) {
      console.warn('NFC Register Tag Error', e);
    }
  }

  public async stopListening() {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent();
    } catch (e) {
      console.warn('NFC Unregister Tag Error', e);
    }
  }
}

export const nfcService = NfcService.getInstance();
