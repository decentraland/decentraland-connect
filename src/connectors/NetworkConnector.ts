import { NetworkConnector as BaseNetworkConnector } from '@web3-react/network-connector'
import { ChainId } from '../types'

export const RPC_URLS = Object.freeze({
  [ChainId.ETHEREUM_MAINNET]:
    'https://mainnet.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
  [ChainId.ETHEREUM_ROPSTEN]:
    'https://ropsten.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
  [ChainId.ETHEREUM_RINKEBY]:
    'https://rinkeby.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
  [ChainId.ETHEREUM_GOERLI]:
    'https://goerli.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
  [ChainId.ETHEREUM_KOVAN]:
    'https://kovan.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
  [ChainId.MATIC_MAINNET]: 'https://rpc-mainnet.maticvigil.com/v1',
  [ChainId.MATIC_MUMBAI]: 'https://rpc-mumbai.com/v1'
})

export class NetworkConnector extends BaseNetworkConnector {
  constructor(chainId: ChainId) {
    super({ urls: RPC_URLS, defaultChainId: chainId })
  }

  getURLs() {
    return RPC_URLS
  }
}
