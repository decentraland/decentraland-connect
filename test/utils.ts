import { AbstractConnector } from '../src/connectors/AbstractConnector'
import { ConnectorUpdate } from '@web3-react/types'
import { ChainId } from '../src/types'

export class StubConnector extends AbstractConnector {
  async activate(): Promise<ConnectorUpdate> {
    return {
      provider: {
        send: () => {}
      },
      account: '0xdeadbeef'
    }
  }

  async getProvider(): Promise<any> {
    return {}
  }

  async getChainId(): Promise<number | string> {
    return ChainId.MAINNET
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
