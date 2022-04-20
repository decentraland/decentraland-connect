import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '../src/connectors/AbstractConnector'
import { Storage } from '../src/storage'

export class StubConnector extends AbstractConnector {
  public account: string | null = null

  async activate(): Promise<ConnectorUpdate> {
    return {
      provider: {
        send: () => {
          // no-op
        }
      },
      account: '0xdeadbeef'
    }
  }

  async getProvider(): Promise<any> {
    return {}
  }

  async getChainId(): Promise<number | string> {
    return ChainId.ETHEREUM_MAINNET
  }

  async getAccount(): Promise<null | string> {
    return null
  }

  deactivate(): void {
    // no-op
  }
}

export class StubClosableConnector extends StubConnector {
  async close() {
    // no-op
  }
}

export class StubStorage extends Storage {
  cache: Record<string, any> = {}

  get(key: string) {
    return this.cache[key]
  }

  set(key: string, value: any) {
    this.cache[key] = value
  }

  remove(key: string) {
    delete this.cache[key]
  }
}

export function getSendableProvider(chainId?: ChainId) {
  return {
    send: async (method: string) => {
      switch (method) {
        case 'eth_chainId':
          return chainId
        default:
          return undefined
      }
    }
  }
}
