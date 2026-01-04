export abstract class Storage {
  abstract get(key: string): string | undefined
  abstract set(key: string, value: string): void
  abstract remove(key: string): void
  abstract removeRegExp(regexp: RegExp): void
}
