import { ConnectorUpdate } from '@web3-react/types'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ChainId } from '@dcl/schemas'
import { AbstractConnector } from './AbstractConnector'

export type WalletConnectV2ConnectorConfig = Parameters<
  typeof EthereumProvider.init
>[0]

export class WalletConnectV2Connector extends AbstractConnector {
  static provider?: EthereumProvider
  static isEnabling: boolean = false

  constructor(public config: WalletConnectV2ConnectorConfig) {
    super({ supportedChainIds: config.chains })
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    if (!WalletConnectV2Connector.provider) {
      WalletConnectV2Connector.provider = await EthereumProvider.init(
        this.config
      )

      WalletConnectV2Connector.provider.on('disconnect', this.handleDisconnect)
      WalletConnectV2Connector.provider.on(
        'chainChanged',
        this.handleChainChanged
      )
      WalletConnectV2Connector.provider.on(
        'accountsChanged',
        this.handleAccountsChanged
      )
    }

    const update: ConnectorUpdate<string | number> = {
      provider: WalletConnectV2Connector.provider
    }

    if (!WalletConnectV2Connector.isEnabling) {
      WalletConnectV2Connector.isEnabling = true

      try {
        const accounts = await WalletConnectV2Connector.provider.enable()

        update.account = accounts[0]
      } catch (e) {
        throw e
      } finally {
        WalletConnectV2Connector.isEnabling = false
      }
    }

    update.chainId = WalletConnectV2Connector.provider.chainId

    return update
  }

  getProvider = async (): Promise<any> => {
    if (!WalletConnectV2Connector.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectV2Connector.provider
  }

  getChainId = async (): Promise<string | number> => {
    if (!WalletConnectV2Connector.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectV2Connector.provider.chainId
  }

  getAccount = async (): Promise<string | null> => {
    if (!WalletConnectV2Connector.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectV2Connector.provider.accounts[0]
  }

  deactivate = async (): Promise<void> => {
    if (!WalletConnectV2Connector.provider) {
      throw new Error('Provider not found')
    }

    await WalletConnectV2Connector.provider.disconnect()
  }

  private handleDisconnect = () => {
    if (WalletConnectV2Connector.provider) {
      WalletConnectV2Connector.provider.removeListener(
        'disconnect',
        this.handleDisconnect
      )
      WalletConnectV2Connector.provider.removeListener(
        'chainChanged',
        this.handleChainChanged
      )
      WalletConnectV2Connector.provider.removeListener(
        'accountsChanged',
        this.handleAccountsChanged
      )

      WalletConnectV2Connector.provider = undefined

      this.emitDeactivate()
    }
  }

  private handleChainChanged = (chainId: ChainId) => {
    this.emitUpdate({
      chainId
    })
  }

  private handleAccountsChanged = (accounts: string[]) => {
    this.emitUpdate({
      account: accounts[0]
    })
  }
}
