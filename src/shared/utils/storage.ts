import * as SecureStore from 'expo-secure-store'
import { createMMKV } from 'react-native-mmkv'
import { StateStorage } from 'zustand/middleware'

const storage = createMMKV()

/**
 * StorageManager - MMKV Implementation
 *
 * Manages storage adapters for Zustand using MMKV (public) and SecureStore (secure).
 */
class StorageManager {
  private static _instance: StorageManager

  private constructor() {}

  public static get instance(): StorageManager {
    if (!this._instance) {
      this._instance = new StorageManager()
    }
    return this._instance
  }

  /**
   * Creates a Zustand middleware compatible storage adapter.
   *
   * @param {boolean} [secure=false] - Whether to use SecureStore (encrypted) or MMKV (public).
   * @returns {StateStorage} An object implementing setItem, getItem, and removeItem.
   */
  public getZustandAdapter(secure: boolean = false): StateStorage {
    if (secure) {
      return {
        setItem: async (name, value) => {
          await SecureStore.setItemAsync(name, value)
        },
        getItem: async (name) => {
          return await SecureStore.getItemAsync(name)
        },
        removeItem: async (name) => {
          await SecureStore.deleteItemAsync(name)
        },
      }
    }

    return {
      setItem: (name, value) => {
        storage.set(name, value)
      },
      getItem: (name) => {
        return storage.getString(name) ?? null
      },
      removeItem: (name) => {
        storage.remove(name)
      },
    }
  }
}

const manager = StorageManager.instance

/**
 * Zustand middleware adapter for public (non-encrypted) application storage.
 * @type {StateStorage}
 */
export const appStorage = manager.getZustandAdapter(false)

/**
 * Zustand middleware adapter for secure (encrypted) application storage.
 * Only for sensitive data like access token, refresh token, etc.
 * @type {StateStorage}
 */
export const appSecureStorage = manager.getZustandAdapter(true)
