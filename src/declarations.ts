interface Ethereum {
  send: unknown
  enable: () => Promise<string[]>
  on?: (method: string, listener: (...args: any[]) => void) => void
  removeListener?: (method: string, listener: (...args: any[]) => void) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare interface Window {
  ethereum?: Ethereum
}
