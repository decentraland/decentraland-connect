import { FortmaticConnector } from '@web3-react/fortmatic-connector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'

// .connect(): Promise<Provider>
// .available(): Promise<ProviderType[]>
// .connect(provider: ProviderType): Promise<Provider>
// .disconnect(): Promise<void>

export enum ProviderType {
  METAMASK = 'metamask',
  FORMATIC = 'formatic',
  WALLET_CONNECT = 'wallet_connect'
}

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  KOVAN = 42
}

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}
export interface Provider {
  request: (reqArgs: RequestArguments) => Promise<unknown>
}

export type ConnectResponse = {
  provider: Provider
  chainId: ChainId
  account: null | string
}

export async function connect(
  providerType: ProviderType,
  chainId: ChainId = ChainId.MAINNET
): Promise<ConnectResponse> {
  const configuration = getConfiguration()
  let connector: AbstractConnector

  switch (providerType) {
    case ProviderType.METAMASK:
      connector = new InjectedConnector({ supportedChainIds: [chainId] })
      break
    case ProviderType.FORMATIC:
      const { apiKey } = configuration[providerType]
      connector = new FortmaticConnector({ apiKey, chainId })
      break
    case ProviderType.WALLET_CONNECT:
      const { urls } = configuration[providerType]
      connector = new WalletConnectConnector({
        rpc: { [chainId]: urls[chainId] },
        bridge: 'https://bridge.walletconnect.org',
        qrcode: true,
        pollingInterval: 15000
      })
      break
    default:
      throw new Error(`Invalid provider ${providerType}`)
  }

  const { provider, account }: ConnectorUpdate = await connector.activate()

  return {
    provider: provider as Provider,
    account: account || '',
    chainId
  }
}

function getConfiguration() {
  return {
    [ProviderType.METAMASK]: {},
    [ProviderType.FORMATIC]: {
      apiKey: 'FORMATIC_API_KEY'
    },
    [ProviderType.WALLET_CONNECT]: {
      urls: {
        [ChainId.MAINNET]: 'https://',
        [ChainId.ROPSTEN]: 'https://',
        [ChainId.RINKEBY]: 'https://',
        [ChainId.KOVAN]: 'https://'
      }
    }
  }
}
