import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { WalletLinkConnector as BaseWalletLinkConnector } from '@web3-react/walletlink-connector'
import { RPC_URLS } from './NetworkConnector'

const APP_NAME = 'Decentraland'

// Coinbase connector to connect a wallet with the Coinbase mobile wallet
export class WalletLinkConnector extends BaseWalletLinkConnector {
  constructor(chainId: ChainId) {
    super({
      url: RPC_URLS[chainId],
      appName: APP_NAME,
      supportedChainIds: [chainId]
    })
  }
}
