import { ProviderType } from '@dcl/schemas'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { WalletLinkConnector as BaseWalletLinkConnector } from '@web3-react/walletlink-connector'
import { getRpcUrls } from '../configuration'

const APP_NAME = 'Decentraland'

// Coinbase connector to connect a wallet with the Coinbase mobile wallet
export class WalletLinkConnector extends BaseWalletLinkConnector {
  constructor(chainId: ChainId) {
    super({
      url: getRpcUrls(ProviderType.WALLET_LINK)[chainId],
      appName: APP_NAME,
      supportedChainIds: [chainId]
    })
  }
}
