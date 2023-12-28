import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { AuthServerProvider } from '../providers'

export class AuthServerConnector extends AbstractConnector {
  private provider: AuthServerProvider

  constructor() {
    super()
    this.provider = new AuthServerProvider()
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const identity = this.provider.getIdentity()

    if (!identity) {
      throw new Error('Cannot activate the Auth Server Connector')
    }

    return {
      provider: this.provider,
      chainId: this.provider.getChainId(),
      account: this.provider.getAccount()
    }
  }

  getProvider = async (): Promise<any> => {
    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    return this.provider.getChainId()
  }

  getAccount = async (): Promise<string | null> => {
    return this.provider.getAccount() ?? null
  }

  deactivate(): void {
    this.provider.deactivate()
  }
}
