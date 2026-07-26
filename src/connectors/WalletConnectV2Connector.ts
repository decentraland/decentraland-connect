import type { AppKit, CaipNetwork, CaipNetworkId, UseAppKitAccountReturn } from '@reown/appkit' with {
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
   * Clears all WalletConnect v2 session data from localStorage and drops the shared AppKit
   * reference so the next activation builds a fresh one.
   */
  static clearStorage = (storage: Storage = new LocalStorage()) => {
    storage.removeRegExp(new RegExp('^wc@2:'))
    storage.removeRegExp(new RegExp('^@appkit'))
    // Drop the shared reference so the next activation rebuilds AppKit. We intentionally do NOT
    // call disconnect() here: AppKit (1.8.x) has no API to destroy a Core/relay connection —
    // disconnect() only ends the session, not the relay — so it cannot prevent an orphaned Core,
    // and firing it here would race the immediate re-init on the same `wc@2:` storage keys. Proper
    // session teardown happens in close() on the normal disconnect path.
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
        message.includes('user rejected methods') ||
        // Namespace errors from @walletconnect/universal-provider's validateChain
        // when session has stale namespace data without matching rpcProviders
        message.includes('is not configured') ||
        message.includes('cannot read properties') ||
        // UniversalProvider.getProvider() returns undefined for a stale session's namespace,
        // causing "undefined is not an object" when setDefaultChain is called on it
        message.includes('undefined is not an object')
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
      this.appKit = WalletConnectV2Connector.sharedAppKit
      return this.appKit
    }

    const { createAppKit } = await import('@reown/appkit')
    // WagmiAdapter enables EIP-6963 wallet discovery for injected wallets (Phantom, MetaMask, etc.).
    // Without an explicit adapter, AppKit's UniversalAdapter only supports WalletConnect relay connections.
    // wagmi and viem are already transitive deps (via thirdweb and @reown/appkit), so this adds zero bundle weight.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { WagmiAdapter } = await import('@reown/appkit-adapter-wagmi')

    const networks = await this.getNetworks()

    // Route RPC traffic through the configured Decentraland endpoints instead of AppKit's default
    // public RPCs (rate limits, no observability through our gateway). Pass them as AppKit
    // customRpcUrls keyed by CAIP network id; the WagmiAdapter builds the viem transport per network
    // from these, so we don't import viem directly (it is only a transitive dependency here).
    const rpcUrls = WalletConnectV2Connector.configuration.urls
    const customRpcUrls: Record<CaipNetworkId, { url: string }[]> = {}
    for (const network of networks) {
      const chainId = Number(network.id)
      const url = rpcUrls[chainId]
      if (url) {
        customRpcUrls[`eip155:${chainId}`] = [{ url }]
      }
    }

    const wagmiAdapter = new WagmiAdapter({
      networks,
      projectId: WalletConnectV2Connector.configuration.projectId,
      customRpcUrls
    })

    this.appKit = createAppKit({
      adapters: [wagmiAdapter],
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
      },
      enableInjected: true,
      enableEIP6963: true // Default is false — must be explicitly enabled for injected wallet discovery
    })

    // Store for reuse
    WalletConnectV2Connector.sharedAppKit = this.appKit

    // Wait for AppKit to restore session from storage
    // Use a subscription to detect when account state is ready rather than fixed timeout
    await this.waitForSessionRestore()

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

    // If status is already resolved, no need to wait
    if (account?.status === 'connected' || account?.status === 'disconnected') {
      return
    }

    // Wait for status to resolve (handles reconnecting, connecting, and undefined)
    const timeoutMs = account?.status ? 5000 : 500 // Longer timeout if actively connecting

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        unsub?.()
        resolve()
      }, timeoutMs)

      const unsub = appKit.subscribeAccount((newAccount: UseAppKitAccountReturn) => {
        if (newAccount?.status === 'connected' || newAccount?.status === 'disconnected') {
          clearTimeout(timeout)
          unsub?.()
          resolve()
        }
      }, 'eip155') as (() => void) | undefined
    })
  }

  /**
   * Validates that a restored session is still alive on the WalletConnect relay
   * by making a lightweight RPC call. Returns false if the session is stale.
   */
  private validateRestoredSession = async (appKit: AppKit): Promise<boolean> => {
    try {
      const walletProvider = appKit.getWalletProvider() as EIP1193Provider | undefined
      if (!walletProvider) {
        return false
      }
      // eth_chainId is a cheap, read-only call that doesn't require user interaction
      await walletProvider.request({ method: 'eth_chainId' })
      return true
    } catch (error) {
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        return false
      }
      // Non-stale errors (e.g. network issues) — treat session as potentially valid
      // to avoid unnecessarily forcing reconnection
      console.warn('Error validating WalletConnect session:', error)
      return true
    }
  }

  /**
   * Opens the AppKit modal and waits for the user to connect.
   * Handles timeout, user cancellation, and stale session errors.
   */
  private openModalAndWaitForConnection = async (): Promise<void> => {
    // Take the AppKit to wait on as a parameter rather than closing over one captured up front: a
    // stale-session retry below reinitializes this.appKit, and the waiter must subscribe to the
    // instance we actually open — otherwise it listens to the stale instance and hangs until the
    // 5-minute timeout.
    const waitForConnection = (appKit: AppKit): Promise<string> => {
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

    const appKit = this.requireAppKit()

    try {
      await appKit.open({ view: 'Connect' })
      await waitForConnection(appKit)
    } catch (error) {
      if (WalletConnectV2Connector.isStaleSessionError(error)) {
        console.warn('Stale session detected, retrying connection...')
        WalletConnectV2Connector.clearStorage()
        await this.initAppKit()
        // Re-acquire the fresh instance and wait on it, not the stale one captured above.
        const freshAppKit = this.requireAppKit()
        await freshAppKit.open({ view: 'Connect' })
        await waitForConnection(freshAppKit)
      } else {
        throw error
      }
    }
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    try {
      await this.initAppKit()
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

    if (isConnected) {
      // Session was restored from localStorage, but it may be stale on the relay.
      // Validate with a lightweight RPC call before trusting it.
      const isSessionAlive = await this.validateRestoredSession(appKit)
      if (!isSessionAlive) {
        console.warn('Restored WalletConnect session is stale, clearing and prompting reconnection...')
        WalletConnectV2Connector.clearStorage()
        await this.initAppKit()
        await this.openModalAndWaitForConnection()
      }
    } else {
      await this.openModalAndWaitForConnection()
    }

    // Re-acquire the AppKit instance: a stale-session retry above calls initAppKit() again, which
    // replaces this.appKit with a fresh instance. The `appKit` captured before the connect block is
    // then stale, so the provider/account/chain must be read from the current instance instead.
    const activeAppKit = this.requireAppKit()

    // Get the wallet provider (EIP-1193 compatible)
    const walletProvider = activeAppKit.getWalletProvider() as EIP1193Provider | undefined
    if (!walletProvider) {
      throw new Error('Failed to get wallet provider after connection')
    }

    // Store the provider with our interface
    this.provider = walletProvider

    // Subscribe to account changes
    this.accountUnsubscribe = activeAppKit.subscribeAccount((account: UseAppKitAccountReturn) => {
      if (account?.address) {
        this.handleAccountsChanged([account.address])
      }
    }, 'eip155') as (() => void) | undefined

    // Subscribe to network changes
    this.networkUnsubscribe = activeAppKit.subscribeCaipNetworkChange((network?: CaipNetwork) => {
      if (network?.id) {
        this.handleChainChanged(network.id)
      }
    }) as (() => void) | undefined

    const address = activeAppKit.getAddress('eip155')
    const chainId = activeAppKit.getChainId()

    return {
      chainId: chainId || this.desiredChainId,
      account: address || null,
      provider: this.provider
    }
  }

  getProvider = async (): Promise<EIP1193Provider> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    const chainId = this.requireAppKit().getChainId()
    return chainId ?? this.desiredChainId
  }

  getAccount = async (): Promise<string | null> => {
    return this.requireAppKit().getAddress('eip155') ?? null
  }

  getWalletName = (): string | undefined => {
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

    // Drop the shared singleton when it points at this now-disconnected instance, so the next
    // activation builds a fresh AppKit rather than reusing a dead one. Keeps the static and
    // instance references from diverging (clearStorage nulls the static; close nulled only the
    // instance before this).
    if (WalletConnectV2Connector.sharedAppKit === this.appKit) {
      WalletConnectV2Connector.sharedAppKit = null
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
