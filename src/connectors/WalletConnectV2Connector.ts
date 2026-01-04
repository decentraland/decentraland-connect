import type { AppKit, CaipNetwork, UseAppKitAccountReturn } from '@reown/appkit' with {
  'resolution-mode': 'import'
}
import type { AppKitNetwork } from '@reown/appkit/networks' with { 'resolution-mode': 'import' }
import { ConnectorUpdate } from '@web3-react/types'
import { ChainId, ProviderType } from '@dcl/schemas'
import { getConfiguration } from '../configuration'
import { LocalStorage, Storage } from '../storage'
import { AbstractConnector } from './AbstractConnector'

// Network names exported from @reown/appkit/networks (re-exported from viem/chains)
type NetworkExportName = 'mainnet' | 'sepolia' | 'polygon' | 'polygonAmoy' | 'arbitrum' | 'optimism' | 'avalanche' | 'bsc' | 'fantom'

// Mapping from ChainId to the network export name in @reown/appkit/networks
const CHAIN_ID_TO_NETWORK_NAME: Partial<Record<ChainId, NetworkExportName>> = {
  [ChainId.ETHEREUM_MAINNET]: 'mainnet',
  [ChainId.ETHEREUM_SEPOLIA]: 'sepolia',
  [ChainId.MATIC_MAINNET]: 'polygon',
  [ChainId.MATIC_AMOY]: 'polygonAmoy',
  [ChainId.ARBITRUM_MAINNET]: 'arbitrum',
  [ChainId.OPTIMISM_MAINNET]: 'optimism',
  [ChainId.AVALANCHE_MAINNET]: 'avalanche',
  [ChainId.BSC_MAINNET]: 'bsc',
  [ChainId.FANTOM_MAINNET]: 'fantom'
}

// EIP-1193 provider interface
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

export class WalletConnectV2Connector extends AbstractConnector {
  private static readonly configuration = getConfiguration()[ProviderType.WALLET_CONNECT_V2]

  private appKit?: AppKit
  provider?: EIP1193Provider
  private accountUnsubscribe?: () => void
  private networkUnsubscribe?: () => void

  constructor(private desiredChainId: ChainId) {
    super({
      supportedChainIds: WalletConnectV2Connector.configuration.chains
    })
  }

  /**
   * Returns the AppKit instance or throws if not initialized.
   */
  private requireAppKit(): AppKit {
    if (!this.appKit) {
      throw new Error('AppKit is not initialized')
    }
    return this.appKit
  }

  /**
   * Clears all WalletConnect v2 session data from localStorage.
   */
  static clearStorage = (storage: Storage = new LocalStorage()) => {
    storage.removeRegExp(new RegExp('^wc@2:'))
    storage.removeRegExp(new RegExp('^@appkit'))
    // Reset the shared AppKit instance so it gets recreated on next activation
    WalletConnectV2Connector.sharedAppKit = null
  }

  private static isStaleSessionError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('no matching key') ||
        message.includes("session topic doesn't exist") ||
        message.includes('missing or invalid') ||
        message.includes('expired') ||
        // "User rejected methods" indicates a method negotiation failure with stale session,
        // not a manual user rejection (which would be "User rejected the request")
        message.includes('user rejected methods')
      )
    }
    return false
  }

  private async getNetworks(): Promise<[AppKitNetwork, ...AppKitNetwork[]]> {
    const chainIds = WalletConnectV2Connector.configuration.chains
    const appkitNetworks = (await import('@reown/appkit/networks')) as Record<NetworkExportName, AppKitNetwork>

    const networks = chainIds
      .map(chainId => {
        const networkName = CHAIN_ID_TO_NETWORK_NAME[chainId]
        if (!networkName) return undefined
        return appkitNetworks[networkName]
      })
      .filter((network): network is AppKitNetwork => network !== undefined)

    if (networks.length === 0) {
      throw new Error('No supported networks found for WalletConnect')
    }

    // Reorder to put the desired chain first
    const desiredNetwork = networks.find(n => n.id === this.desiredChainId)
    if (desiredNetwork) {
      const otherNetworks = networks.filter(n => n.id !== this.desiredChainId)
      return [desiredNetwork, ...otherNetworks]
    }

    return [networks[0], ...networks.slice(1)]
  }

  // Singleton AppKit instance shared across all connector instances
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static sharedAppKit: AppKit | null = null

  private initAppKit = async () => {
    // Reuse existing AppKit instance if available
    if (WalletConnectV2Connector.sharedAppKit) {
      console.log('Reusing existing AppKit instance')
      this.appKit = WalletConnectV2Connector.sharedAppKit
      return this.appKit
    }

    console.log('Initializing AppKit')
    const { createAppKit } = await import('@reown/appkit')

    const networks = await this.getNetworks()

    this.appKit = createAppKit({
      projectId: WalletConnectV2Connector.configuration.projectId,
      networks,
      defaultNetwork: networks[0],
      metadata: {
        name: 'Decentraland',
        description: 'Decentraland - Virtual World',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://decentraland.org',
        icons: ['https://decentraland.org/favicon.ico']
      },
      themeMode: 'dark',
      themeVariables: {
        // Display the modal over other Decentraland UI's modals.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '--w3m-z-index': 3000
      },
      features: {
        analytics: false,
        email: false,
        socials: false,
        onramp: false,
        swaps: false
      }
    })

    // Store for reuse
    WalletConnectV2Connector.sharedAppKit = this.appKit

    // Wait for AppKit to restore session from storage
    // Use a subscription to detect when account state is ready rather than fixed timeout
    await this.waitForSessionRestore()

    console.log('AppKit created', this.appKit)
    return this.appKit
  }

  /**
   * Waits for AppKit to restore any existing session from storage.
   * Checks the account status to determine when session restoration is complete.
   */
  private waitForSessionRestore = async (): Promise<void> => {
    const appKit = this.appKit
    if (!appKit) return

    const account = appKit.getAccount()
    console.log('Current account state:', account)

    // If status is already resolved, no need to wait
    if (account?.status === 'connected' || account?.status === 'disconnected') {
      console.log('Session state already determined:', account.status)
      return
    }

    // Wait for status to resolve (handles reconnecting, connecting, and undefined)
    const timeoutMs = account?.status ? 5000 : 500 // Longer timeout if actively connecting
    console.log(`Session is ${account?.status ?? 'undefined'}, waiting for resolution...`)

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.log('Session state timeout')
        unsub?.()
        resolve()
      }, timeoutMs)

      const unsub = appKit.subscribeAccount((newAccount: UseAppKitAccountReturn) => {
        console.log('Account status changed:', newAccount?.status)
        if (newAccount?.status === 'connected' || newAccount?.status === 'disconnected') {
          clearTimeout(timeout)
          unsub?.()
          resolve()
        }
      }, 'eip155') as (() => void) | undefined
    })
  }

  /**
   * Opens the AppKit modal and waits for the user to connect.
   * Handles timeout, user cancellation, and stale session errors.
   */
  private openModalAndWaitForConnection = async (): Promise<void> => {
    const appKit = this.requireAppKit()
    console.log('Opening AppKit modal for connection...')

    const waitForConnection = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        let settled = false
        const cleanup = (accountUnsub?: () => void, stateUnsub?: () => void) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          accountUnsub?.()
          stateUnsub?.()
        }

        const timeout = setTimeout(() => {
          cleanup()
          reject(new Error('Connection timeout'))
        }, 300000) // 5 minute timeout

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accountUnsub = appKit.subscribeAccount((account: any) => {
          if (account?.isConnected && account?.address) {
            cleanup(accountUnsub as () => void, stateUnsub as () => void)
            resolve(account.address)
          }
        }, 'eip155') as (() => void) | undefined

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stateUnsub = appKit.subscribeState((state: any) => {
          if (!state.open && !appKit.getAddress('eip155')) {
            cleanup(accountUnsub as () => void, stateUnsub as () => void)
            reject(new Error('User closed the modal without connecting'))
          }
        }) as (() => void) | undefined
      })
    }

    try {
      await appKit.open({ view: 'Connect' })
      await waitForConnection()
    } catch (error) {
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        console.warn('Stale session detected, retrying connection...')
        WalletConnectV2Connector.clearStorage()
        await this.initAppKit()
        if (!this.appKit) {
          throw new Error('AppKit reinitialization failed')
        }
        await this.appKit.open({ view: 'Connect' })
        await waitForConnection()
      } else {
        throw error
      }
    }
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    try {
      await this.initAppKit()
      console.log('AppKit initialized')
    } catch (error) {
      console.error('Error initializing AppKit', error)
      // If we get a stale session error during init, clear ALL storage and retry
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        console.warn('WalletConnect session is stale, clearing storage and retrying...')
        WalletConnectV2Connector.clearStorage()
        await this.initAppKit()
      } else {
        throw error
      }
    }

    const appKit = this.requireAppKit()

    // Check if already connected using getAccount() for reliable session detection
    const existingAccount = appKit.getAccount()
    const isConnected = existingAccount?.status === 'connected' && existingAccount?.address
    console.log('Checking existing connection:', { isConnected, status: existingAccount?.status, address: existingAccount?.address })

    if (!isConnected) {
      await this.openModalAndWaitForConnection()
    }

    // Get the wallet provider (EIP-1193 compatible)
    const walletProvider = appKit.getWalletProvider() as EIP1193Provider | undefined
    if (!walletProvider) {
      throw new Error('Failed to get wallet provider after connection')
    }

    // Store the provider with our interface
    this.provider = walletProvider

    // Subscribe to account changes
    this.accountUnsubscribe = appKit.subscribeAccount((account: UseAppKitAccountReturn) => {
      if (account?.address) {
        this.handleAccountsChanged([account.address])
      }
    }, 'eip155') as (() => void) | undefined

    // Subscribe to network changes
    this.networkUnsubscribe = appKit.subscribeCaipNetworkChange((network?: CaipNetwork) => {
      if (network?.id) {
        this.handleChainChanged(network.id)
      }
    }) as (() => void) | undefined

    const address = appKit.getAddress('eip155')
    const chainId = appKit.getChainId()

    console.log('Provider activated', {
      chainId,
      account: address,
      provider: this.provider
    })

    return {
      chainId: chainId || this.desiredChainId,
      account: address || null,
      provider: this.provider
    }
  }

  getProvider = async (): Promise<EIP1193Provider> => {
    console.log('Getting provider', this.provider)
    if (!this.provider) {
      console.error('Provider is undefined', this.provider)
      throw new Error('Provider is undefined')
    }
    console.log('Returning provider', this.provider)

    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    console.log('Getting chainId')
    const chainId = this.requireAppKit().getChainId()
    console.log('Current chainId', chainId)
    return chainId ?? this.desiredChainId
  }

  getAccount = async (): Promise<string | null> => {
    console.log('Getting account')
    return this.requireAppKit().getAddress('eip155') ?? null
  }

  getWalletName = (): string | undefined => {
    console.log('Getting wallet name')
    return this.appKit?.getWalletInfo?.('eip155')?.name
  }

  deactivate = (): void => undefined

  clearInstance = (): EIP1193Provider | undefined => {
    // Capture provider reference and clear it immediately to prevent
    // other methods from using it during/after disconnect
    const provider = this.provider
    if (!provider) {
      return
    }
    this.provider = undefined

    // Unsubscribe from AppKit events
    try {
      this.accountUnsubscribe?.()
      this.networkUnsubscribe?.()
    } catch (error) {
      console.warn('Error unsubscribing from AppKit events:', error)
    }

    this.accountUnsubscribe = undefined
    this.networkUnsubscribe = undefined

    return provider
  }

  close = async (): Promise<void> => {
    // Capture provider reference and clear it immediately to prevent
    // other methods from using it during/after disconnect
    const provider = this.clearInstance()
    if (!provider) {
      return
    }

    try {
      await this.appKit?.disconnect()
    } catch (error) {
      // Log but don't throw - we've already cleaned up our state
      console.warn('Error during WalletConnect disconnect:', error)
    }

    this.appKit = undefined
  }

  handleAccountsChanged = (accounts: string[]): void => {
    this.emitUpdate({ account: accounts[0] })
  }

  handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId })
  }

  handleDisconnect = (): void => {
    this.clearInstance()
    this.emitDeactivate()
  }
}
