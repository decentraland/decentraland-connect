// eslint-disable-next-line import/no-named-as-default, @typescript-eslint/naming-convention
import type EthereumProvider from '@walletconnect/ethereum-provider'
import { ConnectorUpdate } from '@web3-react/types'
import { ChainId, ProviderType } from '@dcl/schemas'
import { getConfiguration } from '../configuration'
import { Storage } from '../storage'
import { AbstractConnector } from './AbstractConnector'

export class WalletConnectV2Connector extends AbstractConnector {
  private static readonly configuration = getConfiguration()[ProviderType.WALLET_CONNECT_V2]

  provider?: typeof EthereumProvider.prototype

  private static getSupportedChainIds(desiredChainId: ChainId): number[] {
    const chainConfig = WalletConnectV2Connector.configuration.chains[desiredChainId]

    if (!chainConfig) {
      throw new Error(
        `Unsupported chainId for WalletConnect: ${desiredChainId}. ` +
          `Supported chains: ${Object.keys(WalletConnectV2Connector.configuration.chains).join(', ')}`
      )
    }

    return [...chainConfig.chains, ...chainConfig.optionalChains]
  }

  constructor(private desiredChainId: ChainId) {
    super({
      supportedChainIds: WalletConnectV2Connector.getSupportedChainIds(desiredChainId)
    })
  }

  static clearStorage = (storage: Storage) => {
    storage.removeRegExp(new RegExp('^wc@2:'))
  }

  private static clearLocalStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('wc@2:')) {
          localStorage.removeItem(key)
        }
      }
    }
  }

  private static isStaleSessionError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('no matching key') ||
        message.includes("session topic doesn't exist") ||
        message.includes('missing or invalid') ||
        message.includes('expired')
      )
    }
    return false
  }

  private initProvider = async () => {
    const module = await import('@walletconnect/ethereum-provider')
    const { chains, optionalChains } = WalletConnectV2Connector.configuration.chains[this.desiredChainId]

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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '--wcm-z-index': '3000'
        }
      },
      // Methods and events based on what is used on the decentraland dapps and the ethereum-provider lib found at:
      // https://github.com/WalletConnect/walletconnect-monorepo/blob/v2.0/providers/ethereum-provider/src/constants/rpc.ts
      // If the wallet doesn't support non optional methods, it will not allow the connection.
      methods: ['eth_sendTransaction', 'personal_sign'],
      optionalMethods: [
        'eth_accounts',
        'eth_requestAccounts',
        'eth_sign',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain'
      ],
      events: ['chainChanged', 'accountsChanged'],
      optionalEvents: ['disconnect']
    })
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    let provider: typeof EthereumProvider.prototype

    try {
      provider = await this.initProvider()
    } catch (error) {
      // If we get a stale session error during init, clear storage and retry
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        console.warn('WalletConnect session is stale, clearing storage and retrying...')
        WalletConnectV2Connector.clearLocalStorage()
        provider = await this.initProvider()
      } else {
        throw error
      }
    }

    let accounts: string[]

    try {
      accounts = await provider.enable()
    } catch (error) {
      // If we get a stale session error during enable, clear storage and retry
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        console.warn('WalletConnect session is stale, clearing storage and retrying...')
        WalletConnectV2Connector.clearLocalStorage()
        provider = await this.initProvider()
        accounts = await provider.enable()
      } else {
        throw error
      }
    }

    provider.on('accountsChanged', this.handleAccountsChanged)
    provider.on('chainChanged', this.handleChainChanged)
    provider.on('disconnect', this.handleDisconnect)

    this.provider = provider

    return {
      chainId: provider.chainId,
      account: accounts[0],
      provider
    }
  }

  getProvider = async (): Promise<typeof EthereumProvider.prototype> => {
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

    return this.provider.accounts[0] ?? null
  }

  getWalletName = (): string | undefined => {
    return this.provider?.session?.peer.metadata.name
  }

  deactivate = (): void => undefined

  close = async (): Promise<void> => {
    // Capture provider reference and clear it immediately to prevent
    // other methods from using it during/after disconnect
    const provider = this.provider
    if (!provider) {
      return
    }
    this.provider = undefined

    // Remove listeners first to prevent any callbacks during disconnect
    provider.removeListener('accountsChanged', this.handleAccountsChanged)
    provider.removeListener('chainChanged', this.handleChainChanged)
    provider.removeListener('disconnect', this.handleDisconnect)

    try {
      await provider.disconnect()
    } catch (error) {
      // Log but don't throw - we've already cleaned up our state
      console.warn('Error during WalletConnect disconnect:', error)
    }
  }

  handleAccountsChanged = (accounts: string[]): void => {
    this.emitUpdate({ account: accounts[0] })
  }

  handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId })
  }

  handleDisconnect = (): void => {
    this.emitDeactivate()
  }
}
