import { ConnectorUpdate } from '@web3-react/types'
import {
  AbstractConnector,
  FortmaticConnector,
  InjectedConnector,
  WalletConnectConnector
} from './connectors'
import { LocalStorage, Storage } from './storage'
import {
  RequestArguments,
  ProviderType,
  ChainId,
  ConnectResponse,
  Provider,
  ClosableConnector,
  LegacyProvider
} from './types'
import { getConfiguration } from './configuration'
import './declarations'

export class ConnectionManager {
  providerType?: ProviderType
  connector?: AbstractConnector

  constructor(public storage: Storage) {}

  async connect(
    providerType?: ProviderType,
    chainId: ChainId = ChainId.MAINNET
  ): Promise<ConnectResponse> {
    const { storageKey } = getConfiguration()

    this.providerType = providerType || this.storage.get(storageKey)
    if (!this.providerType) {
      throw new Error('connect called without a provider and none was stored')
    }

    this.storage.set(storageKey, providerType)
    this.connector = this.getConnector(this.providerType, chainId)

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

  getAvailableProviders(): ProviderType[] {
    const available = [ProviderType.FORTMATIC, ProviderType.WALLET_CONNECT]
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      available.push(ProviderType.INJECTED)
    }
    return available
  }

  async disconnect() {
    if (this.connector) {
      this.connector.deactivate()

      if (this.isClosableConnector()) {
        await (this.connector as ClosableConnector).close()
      }
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
    chainId: ChainId = ChainId.MAINNET
  ): Promise<Provider> {
    const connector = this.getConnector(providerType, chainId)
    const provider = await connector.getProvider()
    return this.toProvider(provider)
  }

  getConnector(
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
      default:
        throw new Error(`Invalid provider ${providerType}`)
    }
  }

  private isClosableConnector() {
    return [ProviderType.FORTMATIC, ProviderType.WALLET_CONNECT].includes(
      this.providerType!
    )
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
