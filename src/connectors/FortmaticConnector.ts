import { FortmaticConnector as BaseFortmaticConnector } from '@web3-react/fortmatic-connector'
import { getConfiguration } from '../configuration'
import { ChainId, ProviderType } from '../types'

export class FortmaticConnector extends BaseFortmaticConnector {
  constructor(chainId: ChainId) {
    const { apiKeys } = getConfiguration()[ProviderType.FORTMATIC]

    super({ chainId, apiKey: apiKeys[chainId] })
  }
}
