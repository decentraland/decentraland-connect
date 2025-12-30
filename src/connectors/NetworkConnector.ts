import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { NetworkConnector as BaseNetworkConnector } from '@web3-react/network-connector'
import { getConfiguration } from '../configuration'
import { toRpcUrlRecord } from '../utils/urlMaps'

export class NetworkConnector extends BaseNetworkConnector {
  constructor(chainId: ChainId) {
    const urls = toRpcUrlRecord(getConfiguration()[ProviderType.NETWORK].urls)

    super({
      urls,
      defaultChainId: chainId
    })
  }
}
