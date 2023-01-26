import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import type { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import type { AbstractConnector } from './AbstractConnector'

export async function createConnector(providerType: ProviderType, _chainId: ChainId): Promise<AbstractConnector> {
  switch (providerType) {
    // case ProviderType.INJECTED:
    //   const { InjectedConnector } = await import('./InjectedConnector')
    //   return new InjectedConnector(chainId)
    // case ProviderType.FORTMATIC:
    //   const { FortmaticConnector } = await import('./FortmaticConnector')
    //   return new FortmaticConnector(chainId)
    // case ProviderType.WALLET_CONNECT:
    //   const { WalletConnectConnector } = await import('./WalletConnectConnector')
    //   return new WalletConnectConnector()
    // case ProviderType.WALLET_LINK:
    //   const { WalletLinkConnector } = await import('./WalletLinkConnector')
    //   return new WalletLinkConnector(chainId)
    // case ProviderType.NETWORK:
    //   const { NetworkConnector } = await import('./NetworkConnector')
    //   return new NetworkConnector(chainId)
    default:
      throw new Error(`Invalid provider ${providerType}`)
  }
}
