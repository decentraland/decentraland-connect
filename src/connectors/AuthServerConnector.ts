import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { AuthServerProvider } from '../providers'
import * as sso from '@dcl/single-sign-on-client'
import { getConfiguration } from '../configuration'
import { ConnectionData } from '../types'
import { ChainId } from '@dcl/schemas'

export class AuthServerConnector extends AbstractConnector {
  static readonly PREVIOUS_ADDRESS_KEY =
    'auth-server-connector-previous-address'

  private provider: AuthServerProvider

  constructor() {
    super()
    this.provider = new AuthServerProvider()
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const previousAddress = localStorage.getItem(
      AuthServerConnector.PREVIOUS_ADDRESS_KEY
    )

    if (previousAddress) {
      const identity = sso.localStorageGetIdentity(previousAddress)

      if (identity) {
        if (identity.expiration >= new Date()) {
          const connectionDataString = localStorage.getItem(
            getConfiguration().storageKey
          )

          const connectionData: ConnectionData | null = connectionDataString
            ? JSON.parse(connectionDataString)
            : null

          const chainId = connectionData?.chainId ?? ChainId.ETHEREUM_MAINNET

          this.provider.setAccount(previousAddress)
          this.provider.setChainId(chainId)

          return {
            provider: this.provider,
            chainId: this.provider.getChainId(),
            account: this.provider.getAccount()
          }
        }
      }
    }

    throw new Error('Cannot activate the Auth Server Connector')
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
    const previousAddress = localStorage.getItem(
      AuthServerConnector.PREVIOUS_ADDRESS_KEY
    )

    if (previousAddress) {
      localStorage.removeItem(AuthServerConnector.PREVIOUS_ADDRESS_KEY)
      sso.localStorageClearIdentity(previousAddress)
    }
  }
}
