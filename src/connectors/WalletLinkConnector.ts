import { WalletLinkConnector as BaseWalletLinkConnector } from '@web3-react/walletlink-connector'
import { ProviderType } from '@dcl/schemas'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { getConfiguration } from '../configuration'

// Coinbase connector to connect a wallet with the Coinbase mobile wallet
export class WalletLinkConnector extends BaseWalletLinkConnector {
  constructor(chainId: ChainId) {
    const config = getConfiguration()[ProviderType.WALLET_LINK]
    const url = config.urls[chainId as keyof typeof config.urls]

    if (!url) {
      throw new Error(`Unsupported chainId for WalletLink: ${chainId}. Supported chains: ${Object.keys(config.urls).join(', ')}`)
    }

    super({
      url,
      appName: config.appName,
      supportedChainIds: [chainId]
    })
  }
}
