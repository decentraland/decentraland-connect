import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { ConnectorEvent, ConnectorUpdate } from '@web3-react/types'
import {
  AbstractConnector,
  InjectedConnector,
  FortmaticConnector,
  NetworkConnector,
  WalletLinkConnector,
  MagicConnector,
  MagicTestConnector,
  WalletConnectV2Connector,
  AuthServerConnector
} from './connectors'
import { LocalStorage, Storage } from './storage'
import {
  ConnectionData,
  ConnectionResponse,
  Provider,
  ClosableConnector
} from './types'
import { getConfiguration } from './configuration'
import { ProviderAdapter } from './ProviderAdapter'
import './declarations'

export class ConnectionManager {
  connector?: AbstractConnector
  promiseOfConnection?: Promise<ConnectionResponse>

  constructor(public storage: Storage) {}

  async connect(
    providerType: ProviderType,
    chainIdToConnect: ChainId = ChainId.ETHEREUM_MAINNET
  ): Promise<ConnectionResponse> {
    // If a previous connection existed, disconnect from it
    if (this.connector) {
      try {
        await this.disconnect()
      } catch (error) {
        console.error('Error disconnecting previous connection', error)
      }
    }

    const connector = this.buildConnector(providerType, chainIdToConnect)
    connector.on(ConnectorEvent.Deactivate, this.handleWeb3ReactDeactivate)

    let { provider, account }: ConnectorUpdate = {}

    try {
      const _connector: ConnectorUpdate = await connector.activate()
      provider = _connector.provider
      account = _connector.account
    } catch (error) {
      console.error('Error activating the connector', error)
      throw error
    }

    // TODO: Remove magic_test provider
    if (
      providerType === ProviderType.MAGIC ||
      providerType === ProviderType.MAGIC_TEST
    ) {
      connector.on(ConnectorEvent.Update, ({ chainId }) => {
        if (chainId) {
          this.setConnectionData(providerType, chainId)
        }
      })
    }

    let chainId = chainIdToConnect

    // We need to return the correct current chain id for the injected providers
    if (providerType === ProviderType.INJECTED) {
      const currentChainIdHex = (await provider.request({
        method: 'eth_chainId'
      })) as string
      chainId = currentChainIdHex
        ? (parseInt(currentChainIdHex, 16) as ChainId)
        : chainId
    }

    this.connector = connector
    this.setConnectionData(providerType, chainId)

    return {
      provider: ProviderAdapter.adapt(provider),
      providerType,
      account: account || '',
      chainId
    }
  }

  isConnected(): boolean {
    return !!this.connector && !!this.getConnectionData()
  }

  async tryPreviousConnection(): Promise<ConnectionResponse> {
    const connectionData = this.getConnectionData()
    if (!connectionData) {
      throw new Error(
        'Could not find a valid provider. Make sure to call the `connect` method first'
      )
    }

    if (this.connector) {
      return {
        provider: await this.connector.getProvider(),
        providerType: connectionData.providerType,
        chainId: connectionData.chainId,
        account: await this.connector.getAccount()
      }
    }

    const response = this.promiseOfConnection
      ? await this.promiseOfConnection
      : await (this.promiseOfConnection = this.connect(
          connectionData.providerType,
          connectionData.chainId
        ))
    this.promiseOfConnection = undefined

    return {
      ...response,
      chainId: this.getConnectionData()!.chainId
    }
  }

  getAvailableProviders(): ProviderType[] {
    const available = [
      ProviderType.FORTMATIC,
      ProviderType.WALLET_CONNECT,
      ProviderType.WALLET_LINK
    ]
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      available.unshift(ProviderType.INJECTED)
    } else {
      // we're assuming if there's no window, it's mobile
      available.unshift(ProviderType.METAMASK_MOBILE)
    }
    return available
  }

  async disconnect(): Promise<void> {
    if (this.connector) {
      // Remove event listeners
      this.connector.removeAllListeners(ConnectorEvent.Deactivate)
      this.connector.removeAllListeners(ConnectorEvent.Update)

      // Deactivate and close the connector if it's closable
      this.connector.deactivate()
      if (this.isClosableConnector()) {
        await (this.connector as ClosableConnector).close()
      }
    }

    this.clearConnectionData()

    this.connector = undefined
  }

  async getProvider(): Promise<Provider> {
    if (!this.connector) {
      throw new Error('No valid connector found. Please .connect() first')
    }
    return this.connector.getProvider()
  }

  /**
   * Obtain the name of the underlying wallet providing the connection.
   * Will only return a value if the provider is a WalletConnectV2Connector that has an ongoing session.
   * TODO: Enhance it to return the name of the wallet for other providers as well if possible.
   */
  getWalletName = (): string | undefined => {
    if (this.connector instanceof WalletConnectV2Connector) {
      return this.connector.getWalletName()
    }

    return undefined
  }

  async createProvider(
    providerType: ProviderType,
    chainId: ChainId = ChainId.ETHEREUM_MAINNET
  ): Promise<Provider> {
    const connector = this.buildConnector(providerType, chainId)
    const provider = await connector.getProvider()
    return ProviderAdapter.adapt(provider)
  }

  buildConnector(
    providerType: ProviderType,
    chainId: ChainId
  ): AbstractConnector {
    switch (providerType) {
      case ProviderType.INJECTED:
        return new InjectedConnector(chainId)
      case ProviderType.FORTMATIC:
        return new FortmaticConnector(chainId)
      case ProviderType.MAGIC:
        return new MagicConnector(chainId)
      case ProviderType.MAGIC_TEST:
        return new MagicTestConnector(chainId)
      case ProviderType.WALLET_LINK:
        return new WalletLinkConnector(chainId)
      case ProviderType.NETWORK:
        return new NetworkConnector(chainId)
      case ProviderType.WALLET_CONNECT_V2:
        return new WalletConnectV2Connector(chainId)
      case ProviderType.AUTH_SERVER:
        return new AuthServerConnector()
      default:
        throw new Error(`Invalid provider ${providerType}`)
    }
  }

  getConnectionData(): ConnectionData | undefined {
    const { storageKey } = getConfiguration()
    const connectionData = this.storage.get(storageKey)
    return connectionData ? JSON.parse(connectionData) : undefined
  }

  private clearConnectionData = () => {
    const { storageKey } = getConfiguration()
    this.storage.remove(storageKey)
    // Clear any data that might have been stored by the different connectors.
    // Clearing them even if they were not the ones used is not an issue as it is a cheap operation.
    WalletConnectV2Connector.clearStorage(this.storage)
  }

  private setConnectionData(providerType: ProviderType, chainId: ChainId) {
    const { storageKey } = getConfiguration()
    const connectionData = JSON.stringify({
      providerType,
      chainId
    } as ConnectionData)
    this.storage.set(storageKey, connectionData)
  }

  private isClosableConnector() {
    return this.connector && typeof this.connector['close'] !== 'undefined'
  }

  private handleWeb3ReactDeactivate = async () => {
    // Whenever the user manually disconnects the account from their wallet, the event will be
    // intercepted by this handler, calling the disconnect method.
    // Necessary to sanitize the state and prevent the continuation of a dead connection.
    try {
      await this.disconnect()
    } catch (error) {
      console.error(error)
    }
  }
}

export const connection = new ConnectionManager(new LocalStorage())
