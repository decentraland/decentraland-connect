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

  // Removes all keys from local storage that match a provided RegExp.
  removeRegExp(regexp: RegExp): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)

      if (key && regexp.test(key)) {
        localStorage.removeItem(key)
      }
    }
  }
}
