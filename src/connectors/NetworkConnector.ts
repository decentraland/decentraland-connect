import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { NetworkConnector as BaseNetworkConnector } from '@web3-react/network-connector'
import { getRpcUrls } from '../configuration'

export const RPC_URLS = Object.freeze(getRpcUrls())

export class NetworkConnector extends BaseNetworkConnector {
  constructor(chainId: ChainId) {
    super({ urls: RPC_URLS, defaultChainId: chainId })
  }
}
