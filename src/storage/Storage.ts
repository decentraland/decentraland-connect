export abstract class Storage {
  abstract get(key: string): any | undefined
  abstract set(key: string, value: any): void
  abstract remove(key: string): void
}
