import { ChainId } from '@dcl/schemas'
import { ConnectorUpdate } from '@web3-react/types'
import {
  AbstractConnector,
  InjectedConnector,
  FortmaticConnector,
  WalletConnectConnector,
  NetworkConnector
} from './connectors'
import { LocalStorage, Storage } from './storage'
import {
  RequestArguments,
  ProviderType,
  ConnectionData,
  ConnectionResponse,
  Provider,
  ClosableConnector,
  LegacyProvider
} from './types'
import { getConfiguration } from './configuration'
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
      provider: this.toProvider(provider),
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

    return this.connect(connectionData.providerType, connectionData.chainId)
  }

  getAvailableProviders(): ProviderType[] {
    const available = [ProviderType.FORTMATIC, ProviderType.WALLET_CONNECT]
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      available.unshift(ProviderType.INJECTED)
    }
    return available
  }

  async disconnect() {
    if (this.connector) {
      this.connector.deactivate()

      if (this.isClosableConnector()) {
        await (this.connector as ClosableConnector).close()
      }

      this.storage.clear()
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
    return this.toProvider(provider)
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

  private toProvider(provider: LegacyProvider | Provider): Provider {
    const newProvider = provider as Provider

    if (this.isLegacyProvider(provider)) {
      newProvider.request = ({ method, params }: RequestArguments) =>
        (provider as LegacyProvider).send(method, params)
    }

    return newProvider
  }

  private isLegacyProvider(provider: LegacyProvider | Provider): boolean {
    return (
      typeof provider['request'] === 'undefined' &&
      typeof provider['send'] !== 'undefined'
    )
  }
}

export const connection = new ConnectionManager(new LocalStorage())
