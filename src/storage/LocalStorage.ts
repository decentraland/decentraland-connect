import { Storage } from './Storage'

export class LocalStorage extends Storage {
  get(key: string): any | undefined {
    const result = window.localStorage.getItem(key)
    return result === null ? undefined : result
  }

  set(key: string, value: any): void {
    window.localStorage.setItem(key, value)
  }

  remove(key: string): void {
    window.localStorage.removeItem(key)
  }
}
