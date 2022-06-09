import { ProviderType } from '@dcl/schemas'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { WalletLinkConnector as BaseWalletLinkConnector } from '@web3-react/walletlink-connector'
import { getConfiguration } from '../configuration'

// Coinbase connector to connect a wallet with the Coinbase mobile wallet
export class WalletLinkConnector extends BaseWalletLinkConnector {
  constructor(chainId: ChainId) {
    const config = getConfiguration()[ProviderType.WALLET_LINK]

    super({
      url: config.urls[chainId],
      appName: config.appName,
      supportedChainIds: [chainId]
    })
  }
}
