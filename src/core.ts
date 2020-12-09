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
  connector: AbstractConnector

  async connect(
    providerType: ProviderType,
    chainId: ChainId = ChainId.MAINNET
  ): Promise<ConnectResponse> {
    const configuration = getConfiguration()
    this.providerType = providerType

    switch (this.providerType) {
      case ProviderType.METAMASK:
        this.connector = new InjectedConnector({ supportedChainIds: [chainId] })
        break
      case ProviderType.FORMATIC:
        const { apiKey } = configuration[this.providerType]
        this.connector = new FortmaticConnector({ apiKey, chainId })
        break
      case ProviderType.WALLET_CONNECT:
        const { urls } = configuration[this.providerType]
        this.connector = new WalletConnectConnector({
          rpc: { [chainId]: urls[chainId] },
          bridge: 'https://bridge.walletconnect.org',
          qrcode: true,
          pollingInterval: 15000
        })
        break
      default:
        throw new Error(`Invalid provider ${providerType}`)
    }

    await this.disconnect()

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

  async available(): Promise<ProviderType[]> {
    return []
  }

  async disconnect() {
    if (this.connector) {
      this.connector.deactivate()

      if (this.isClosableConnector()) {
        await (this.connector as ClosableConnector).close()
      }
    }
  }

  private isClosableConnector() {
    return [ProviderType.FORMATIC, ProviderType.WALLET_CONNECT].includes(
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

export default new Connector()
