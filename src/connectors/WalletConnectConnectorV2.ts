import { ConnectorUpdate } from '@web3-react/types'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ChainId } from '@dcl/schemas'
import { AbstractConnector } from './AbstractConnector'

export type WalletConnectConnectorV2Config = Parameters<
  typeof EthereumProvider.init
>[0]

export class WalletConnectConnectorV2 extends AbstractConnector {
  static provider?: EthereumProvider
  static isEnabling: boolean = false

  constructor(public config: WalletConnectConnectorV2Config) {
    super({ supportedChainIds: config.chains })
    console.log('CONSTRUCTOR')
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    console.log('ACTIVATE')
    if (!WalletConnectConnectorV2.provider) {
      WalletConnectConnectorV2.provider = await EthereumProvider.init(
        this.config
      )

      WalletConnectConnectorV2.provider.on('disconnect', this.handleDisconnect)
      WalletConnectConnectorV2.provider.on(
        'chainChanged',
        this.handleChainChanged
      )
      WalletConnectConnectorV2.provider.on(
        'accountsChanged',
        this.handleAccountsChanged
      )
    }

    const update: ConnectorUpdate<string | number> = {
      provider: WalletConnectConnectorV2.provider
    }

    if (!WalletConnectConnectorV2.isEnabling) {
      WalletConnectConnectorV2.isEnabling = true

      try {
        const accounts = await WalletConnectConnectorV2.provider.enable()

        update.account = accounts[0]
      } catch (e) {
        throw e
      } finally {
        WalletConnectConnectorV2.isEnabling = false
      }
    }

    update.chainId = WalletConnectConnectorV2.provider.chainId

    return update
  }

  getProvider = async (): Promise<any> => {
    console.log('GET PROVIDER')
    if (!WalletConnectConnectorV2.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectConnectorV2.provider
  }

  getChainId = async (): Promise<string | number> => {
    console.log('GET CHAIN ID')
    if (!WalletConnectConnectorV2.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectConnectorV2.provider.chainId
  }

  getAccount = async (): Promise<string | null> => {
    console.log('GET ACCOUNT')
    if (!WalletConnectConnectorV2.provider) {
      throw new Error('Provider not found')
    }

    return WalletConnectConnectorV2.provider.accounts[0]
  }

  deactivate = async (): Promise<void> => {
    console.log('DEACTIVATE')
    if (!WalletConnectConnectorV2.provider) {
      throw new Error('Provider not found')
    }

    await WalletConnectConnectorV2.provider.disconnect()
  }

  private handleDisconnect = () => {
    console.log('HANDLE DISCONNECT')
    if (WalletConnectConnectorV2.provider) {
      WalletConnectConnectorV2.provider.removeListener(
        'disconnect',
        this.handleDisconnect
      )
      WalletConnectConnectorV2.provider.removeListener(
        'chainChanged',
        this.handleChainChanged
      )
      WalletConnectConnectorV2.provider.removeListener(
        'accountsChanged',
        this.handleAccountsChanged
      )

      WalletConnectConnectorV2.provider = undefined

      this.emitDeactivate()
    }
  }

  private handleChainChanged = (chainId: ChainId) => {
    console.log('HANDLE CHAIN CHANGED', chainId)
    this.emitUpdate({
      chainId
    })
  }

  private handleAccountsChanged = (accounts: string[]) => {
    console.log('HANDLE ACCOUNTS CHANGED', accounts)
    this.emitUpdate({
      account: accounts[0]
    })
  }
}
