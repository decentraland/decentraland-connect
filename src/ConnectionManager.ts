import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { ConnectorUpdate } from '@web3-react/types'
import {
  AbstractConnector,
  InjectedConnector,
  FortmaticConnector,
  WalletConnectConnector,
  NetworkConnector,
  WalletLinkConnector
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

  constructor(public storage: Storage) {}

  async connect(
    providerType: ProviderType,
    chainId: ChainId = ChainId.ETHEREUM_MAINNET
  ): Promise<ConnectionResponse> {
    this.setConnectionData(providerType, chainId)
    this.connector = this.buildConnector(providerType, chainId)

    const {
      provider,
      account
    }: ConnectorUpdate = await this.connector.activate()

    return {
      provider: ProviderAdapter.adapt(provider),
      providerType,
      account: account || '',
      chainId
    }
  }

  async tryPreviousConnection(): Promise<ConnectionResponse> {
    const connectionData = this.getConnectionData()
    if (!connectionData) {
      throw new Error(
        'Could not find a valid provider. Make sure to call the `connect` method first'
      )
    }

    const response = await this.connect(
      connectionData.providerType,
      connectionData.chainId
    )

    // If the provider type is injected, the chainId could have changed since previous connection and still connect successfuly.
    // We need to check if the chainId has changed, and update the connectionData if so.
    if (response.providerType === ProviderType.INJECTED) {
      const currentChainIdHex = (await response.provider.request({
        method: 'eth_chainId'
      })) as string
      const currentChainId = currentChainIdHex
        ? (parseInt(currentChainIdHex, 16) as ChainId)
        : null
      if (currentChainId && connectionData.chainId !== currentChainId) {
        this.setConnectionData(connectionData.providerType, currentChainId)
      }
    }

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
      // we're asuming if there's no window, it's mobile
      available.unshift(ProviderType.METAMASK_MOBILE)
    }
    return available
  }

  async disconnect() {
    if (this.connector) {
      this.connector.deactivate()

      if (this.isClosableConnector()) {
        await (this.connector as ClosableConnector).close()
      }
      const { storageKey } = getConfiguration()
      this.storage.remove(storageKey)
      this.connector = undefined
    }
  }

  async getProvider(): Promise<Provider> {
    if (!this.connector) {
      throw new Error('No valid connector found. Please .connect() first')
    }
    return this.connector.getProvider()
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
      case ProviderType.WALLET_CONNECT:
        return new WalletConnectConnector(chainId)
      case ProviderType.WALLET_LINK:
        return new WalletLinkConnector(chainId)
      case ProviderType.NETWORK:
        return new NetworkConnector(chainId)
      default:
        throw new Error(`Invalid provider ${providerType}`)
    }
  }

  getConnectionData(): ConnectionData | undefined {
    const { storageKey } = getConfiguration()
    const connectionData = this.storage.get(storageKey)
    return connectionData ? JSON.parse(connectionData) : undefined
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
}

export const connection = new ConnectionManager(new LocalStorage())
