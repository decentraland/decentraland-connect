import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { ChainId, ProviderType } from '@dcl/schemas'
// tslint:disable-next-line
import type EthereumProvider from '@walletconnect/ethereum-provider'
import { Storage } from '../storage'
import { getConfiguration } from '../configuration'

export class WalletConnectV2Connector extends AbstractConnector {
  private static readonly configuration = getConfiguration()[ProviderType.WALLET_CONNECT_V2]

  provider?: typeof EthereumProvider.prototype

  constructor(private desiredChainId: ChainId) {
    super({
      supportedChainIds: ((): number[] => {
        const {
          chains,
          optionalChains
        } = WalletConnectV2Connector.configuration.chains[desiredChainId]

        return [...chains, ...optionalChains]
      })()
    })
  }

  static clearStorage = (storage: Storage) => {
    storage.removeRegExp(new RegExp('^wc@2:'))
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const provider = await import('@walletconnect/ethereum-provider').then(
      module => {
        const {
          chains,
          optionalChains
        } = WalletConnectV2Connector.configuration.chains[this.desiredChainId]

        return module.default.init({
          projectId: WalletConnectV2Connector.configuration.projectId,
          rpcMap: WalletConnectV2Connector.configuration.urls,
          chains,
          optionalChains,
          showQrModal: true,
          // Decentraland's RPCs don't support the `test` method used for the ping.
          disableProviderPing: true,
          qrModalOptions: {
            themeVariables: {
              // Display the WC modal over other Decentraland UI's modals.
              // Won't be visible without this.
              '--w3m-z-index': '3000'
            }
          },
          // Methods expected for the connecting wallet to provide in order to function with Decentraland's dApps.
          methods: [
            'eth_sendTransaction',
            'personal_sign',
            'eth_signTypedData_v4'
          ],
          // Events expected for the connecting wallet to emit.
          events: ['accountsChanged', 'chainChanged', 'disconnect']
        })
      }
    )

    const accounts = await provider.enable()

    provider.on('accountsChanged', this.handleAccountsChanged)
    provider.on('chainChanged', this.handleChainChanged)
    provider.on('disconnect', this.handleDisconnect)

    this.provider = provider

    return {
      chainId: provider.chainId,
      account: accounts[0],
      provider: this.provider
    }
  }

  getProvider = async (): Promise<any> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider.chainId
  }

  getAccount = async (): Promise<string | null> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider.accounts[0]
  }

  getWalletName = (): string | undefined => {
    return this.provider?.session?.peer.metadata.name
  }

  deactivate = (): void => {
    if (!this.provider) {
      return
    }

    this.emitDeactivate()

    this.provider
      .removeListener('accountsChanged', this.handleAccountsChanged)
      .removeListener('chainChanged', this.handleChainChanged)
      .removeListener('disconnect', this.handleDisconnect)
      .disconnect()
  }

  handleAccountsChanged = (accounts: string[]): void => {
    this.emitUpdate({ account: accounts[0] })
  }

  handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId })
  }

  handleDisconnect = (): void => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    this.deactivate()
  }
}
