import { FortmaticConnector } from '@web3-react/fortmatic-connector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'

import { getConfiguration } from './configuration'
import {
  RequestArguments,
  ProviderType,
  ChainId,
  ConnectResponse,
  Provider,
  ClosableConnector,
  LegacyProvider
} from './types'

class Connector {
  providerType: ProviderType
  connector?: AbstractConnector

  async connect(
    providerType: ProviderType,
    chainId: ChainId = ChainId.MAINNET
  ): Promise<ConnectResponse> {
    this.providerType = providerType
    this.connector = this.getConnector(providerType, chainId)

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

  available(): ProviderType[] {
    const available = [ProviderType.FORTMATIC, ProviderType.WALLET_CONNECT]
    if (window.ethereum !== undefined) {
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

  async getProvider() {
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

  private getConnector(
    providerType: ProviderType,
    chainId: ChainId
  ): AbstractConnector {
    const configuration = getConfiguration()

    switch (providerType) {
      case ProviderType.INJECTED:
        return new InjectedConnector({ supportedChainIds: [chainId] })
      case ProviderType.FORTMATIC: {
        const { apiKey } = configuration[providerType]
        return new FortmaticConnector({ apiKey, chainId })
      }
      case ProviderType.WALLET_CONNECT: {
        const { urls, bridge } = configuration[providerType]
        return new WalletConnectConnector({
          rpc: { [chainId]: urls[chainId] },
          bridge,
          qrcode: true,
          pollingInterval: 15000
        })
      }
      default:
        throw new Error(`Invalid provider ${providerType}`)
    }
  }

  private isClosableConnector() {
    return [ProviderType.FORTMATIC, ProviderType.WALLET_CONNECT].includes(
      this.providerType
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
      typeof provider['send'] !== undefined
    )
  }
}

export const connector = new Connector()
