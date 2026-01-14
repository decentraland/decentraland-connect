import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { getConfiguration } from '../configuration'
import { Provider } from '../types'

// Thirdweb types - we use any to avoid requiring thirdweb as a dependency
// The actual thirdweb package is imported dynamically by the consuming app
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThirdwebClient = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThirdwebWallet = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThirdwebChain = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EIP1193Provider = any

/**
 * ThirdwebConnector - Connects to thirdweb's in-app wallet (email OTP, social logins)
 *
 * Similar to MagicConnector, this wraps thirdweb's SDK and exposes an EIP-1193 compatible provider.
 *
 * IMPORTANT: The consuming application must:
 * 1. Have `thirdweb` installed as a dependency
 * 2. Call setThirdwebClientId() before using this connector
 * 3. Authenticate the user via thirdweb SDK BEFORE calling connect()
 *
 * The connector uses autoConnect() to restore an existing thirdweb session.
 *
 * @example
 * ```typescript
 * import { setThirdwebClientId, connection } from 'decentraland-connect'
 * import { ProviderType, ChainId } from '@dcl/schemas'
 *
 * // 1. Configure thirdweb
 * setThirdwebClientId('your-client-id')
 *
 * // 2. In your app, authenticate with thirdweb SDK directly:
 * //    - preAuthenticate() to send OTP
 * //    - wallet.connect() to verify OTP
 *
 * // 3. Connect (this will auto-connect to the existing session)
 * const result = await connection.connect(ProviderType.THIRDWEB, ChainId.ETHEREUM_MAINNET)
 * ```
 */
export class ThirdwebConnector extends AbstractConnector {
  private chainId: ChainId
  private client: ThirdwebClient | null
  private wallet: ThirdwebWallet | null
  private chain: ThirdwebChain | null
  private eip1193Provider: EIP1193Provider | null

  constructor(desiredChainId: ChainId) {
    super({
      supportedChainIds: getConfiguration().thirdweb?.chains ?? [
        ChainId.ETHEREUM_MAINNET,
        ChainId.ETHEREUM_SEPOLIA
      ]
    })
    this.chainId = desiredChainId
    this.client = null
    this.wallet = null
    this.chain = null
    this.eip1193Provider = null
  }

  /**
   * Get or create the thirdweb client
   */
  private async getClient(): Promise<ThirdwebClient> {
    if (this.client) {
      return this.client
    }

    // Dynamic require to avoid TypeScript trying to resolve thirdweb types at compile time
    // thirdweb must be installed by the consuming application
    let thirdweb
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      thirdweb = require('thirdweb')
    } catch (error) {
      throw new Error('Thirdweb: thirdweb package is not installed.')
    }

    const config = getConfiguration().thirdweb

    if (!config?.clientId) {
      throw new Error(
        'Thirdweb: clientId is not configured. Call setThirdwebClientId() first.'
      )
    }

    this.client = thirdweb.createThirdwebClient({ clientId: config.clientId })
    return this.client
  }

  /**
   * Get or create the in-app wallet instance
   */
  private async getWallet(): Promise<ThirdwebWallet> {
    if (this.wallet) {
      return this.wallet
    }

    // Dynamic require to avoid TypeScript trying to resolve thirdweb types at compile time
    let wallets
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      wallets = require('thirdweb/wallets')
    } catch (error) {
      throw new Error(
        'Thirdweb: thirdweb package is not installed. Run: npm install thirdweb'
      )
    }

    this.wallet = wallets.inAppWallet()
    return this.wallet
  }

  /**
   * Get or create the thirdweb chain object
   */
  private async getChain(): Promise<ThirdwebChain> {
    if (this.chain) {
      return this.chain
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const chains = require('thirdweb/chains')
    this.chain = chains.defineChain(this.chainId)
    return this.chain
  }

  /**
   * Activate the connector (called by ConnectionManager.connect())
   *
   * This will auto-connect to an existing thirdweb session.
   * The user must have authenticated via thirdweb SDK before calling this.
   */
  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const client = await this.getClient()
    const wallet = await this.getWallet()

    // Try to auto-connect to existing session
    let account
    try {
      account = await wallet.autoConnect({ client })
    } catch (error) {
      throw new Error(
        'Thirdweb: No active session. User must authenticate first.'
      )
    }

    if (!account) {
      throw new Error(
        'Thirdweb: No active session. User must authenticate first.'
      )
    }

    // Create the EIP-1193 provider using thirdweb's official adapter
    const chain = await this.getChain()

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EIP1193 } = require('thirdweb/wallets')
    this.eip1193Provider = EIP1193.toProvider({
      wallet,
      chain,
      client
    })

    // Wrap with our Provider interface
    const provider = await this.getProvider()

    const result = {
      provider,
      chainId: this.chainId,
      account: account.address
    }

    return result
  }

  /**
   * Get the EIP-1193 compatible provider
   *
   * Uses thirdweb's official EIP1193.toProvider() adapter which provides
   * a fully compliant EIP-1193 provider with all RPC methods supported.
   * This is similar to how MagicConnector works - the SDK provides the provider.
   *
   * @see https://portal.thirdweb.com/references/typescript/v5/eip1193/toProvider
   */
  getProvider = async (): Promise<Provider> => {
    if (!this.eip1193Provider) {
      throw new Error(
        'Thirdweb: wallet is not connected. Call activate() first.'
      )
    }

    // Wrap the thirdweb provider with our Provider interface flags
    // Similar to how MagicConnector wraps its provider
    const thirdwebProvider = this.eip1193Provider

    return {
      ...thirdwebProvider,
      isDapper: false,
      isFortmatic: false,
      isMetamask: false,
      isMagic: false,
      isThirdweb: true,
      // Proxy the request method to handle wallet_switchEthereumChain
      request: new Proxy(thirdwebProvider.request, {
        apply: async (target, _thisArg, argumentsList) => {
          const method = argumentsList[0]?.method

          // Handle wallet_switchEthereumChain by updating internal state
          if (method === 'wallet_switchEthereumChain') {
            try {
              const newChainIdHex = argumentsList[0]?.params?.[0]?.chainId
              const newChainId = parseInt(newChainIdHex, 16)

              if (
                this.supportedChainIds &&
                !this.supportedChainIds.includes(newChainId)
              ) {
                throw new Error('Thirdweb: unsupported chain')
              }

              // Update internal chain and recreate provider
              this.chainId = newChainId as ChainId
              this.chain = null // Reset chain to be recreated
              this.eip1193Provider = null // Reset provider to be recreated

              // Recreate provider with new chain
              const client = await this.getClient()
              const wallet = await this.getWallet()
              const chain = await this.getChain()
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { EIP1193 } = require('thirdweb/wallets')
              this.eip1193Provider = EIP1193.toProvider({
                wallet,
                chain,
                client
              })

              this.emitUpdate({ chainId: newChainId })
              return null
            } catch (error) {
              throw error
            }
          }

          return target.bind(thirdwebProvider)(...argumentsList)
        }
      }),
      // Add sendAsync for compatibility
      sendAsync: new Proxy(thirdwebProvider.request, {
        apply: async (target, _thisArg, argumentsList) => {
          return target.bind(thirdwebProvider)(...argumentsList)
        }
      })
    } as Provider
  }

  getChainId = async (): Promise<number | string> => {
    return this.chainId
  }

  getAccount = async (): Promise<string | null> => {
    if (!this.wallet) return null
    try {
      const account = this.wallet.getAccount()
      return account?.address ?? null
    } catch {
      return null
    }
  }

  /**
   * Close/disconnect the wallet
   */
  public async close(): Promise<void> {
    if (this.wallet) {
      await this.wallet.disconnect()
    }
    this.wallet = null
    this.chain = null
    this.eip1193Provider = null
  }

  deactivate = (): void => {
    // Called when switching to a different connector
  }
}
