interface Ethereum {
  send: unknown
  enable: () => Promise<string[]>
  on?: (method: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (method: string, listener: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: Ethereum
  }
}

export {}
