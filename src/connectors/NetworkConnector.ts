import { ProviderType } from '@dcl/schemas'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { NetworkConnector as BaseNetworkConnector } from '@web3-react/network-connector'
import { getConfiguration } from '../configuration'

export class NetworkConnector extends BaseNetworkConnector {
  constructor(chainId: ChainId) {
    super({
      urls: getConfiguration()[ProviderType.NETWORK].urls,
      defaultChainId: chainId
    })
  }
}
