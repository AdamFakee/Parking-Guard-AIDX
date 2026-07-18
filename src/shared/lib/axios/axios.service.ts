import { create, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { setupInterceptorsTo } from './axios.interceptor'

export class AxiosService {
  private static instance: AxiosService
  private axiosInstance: AxiosInstance
  readonly baseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api-wms-dev.aidx.vn'

  constructor() {
    this.axiosInstance = setupInterceptorsTo(
      create({
        baseURL: this.baseUrl,
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }

  static getInstance(): AxiosService {
    if (!AxiosService.instance) {
      AxiosService.instance = new AxiosService()
    }
    return AxiosService.instance
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }

  get<T>(path: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get<T>(path, config)
  }

  post<T>(path: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axiosInstance.post<T>(path, data, config)
  }

  put<T>(path: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axiosInstance.put<T>(path, data, config)
  }

  patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.axiosInstance.patch<T>(path, data, config)
  }

  delete<T>(path: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.delete<T>(path, config)
  }
}
