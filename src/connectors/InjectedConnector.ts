import { ChainId } from '@dcl/schemas'
import { InjectedConnector as BaseInjectedConnector } from '@web3-react/injected-connector'

export class InjectedConnector extends BaseInjectedConnector {
  constructor(chainId: ChainId) {
    super({
      supportedChainIds: [chainId]
    })
  }
}
