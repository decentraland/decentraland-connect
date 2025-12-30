import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'

export type ChainMap<T> = Partial<Record<ChainId, T>>
export type RpcUrlMap = ChainMap<string>

export interface WalletConnectChainEntry {
  chains: ChainId[]
  optionalChains: [ChainId, ...ChainId[]]
}

export type MagicConfiguration = {
  apiKey: string
  urls: RpcUrlMap
  chains: ChainId[]
}

export interface Configuration {
  storageKey: string
  [ProviderType.INJECTED]: Record<string, never>
  [ProviderType.FORTMATIC]: {
    apiKeys: ChainMap<string>
    urls: RpcUrlMap
  }
  [ProviderType.NETWORK]: {
    urls: RpcUrlMap
  }
  [ProviderType.WALLET_LINK]: {
    appName: string
    urls: RpcUrlMap
  }
  [ProviderType.WALLET_CONNECT_V2]: {
    projectId: string
    urls: RpcUrlMap
    chains: ChainMap<WalletConnectChainEntry>
  }
  [ProviderType.MAGIC]: MagicConfiguration
  [ProviderType.MAGIC_TEST]: MagicConfiguration
}
