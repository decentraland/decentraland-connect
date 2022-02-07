import { ChainId } from '@dcl/schemas'
import { WalletLinkConnector as BaseInjectedConnector } from '@web3-react/walletlink-connector'
import { RPC_URLS } from './NetworkConnector'

export class WalletLinkConnector extends BaseInjectedConnector {
  constructor(chainId: ChainId) {
    super({
      supportedChainIds: [chainId],
      url: RPC_URLS[chainId],
      appName: ''
    })
  }
}
