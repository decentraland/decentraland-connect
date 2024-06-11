import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { InjectedConnector as BaseInjectedConnector } from '@web3-react/injected-connector'
import { ConnectorUpdate } from '@web3-react/types'

const UNLOCK_WALLET_TIMEOUT = 60 * 1000 // 60 seconds

export class InjectedConnector extends BaseInjectedConnector {
  constructor(chainId: ChainId) {
    super({
      supportedChainIds: [chainId]
    })
  }

  activate = async (): Promise<ConnectorUpdate> => {
    return new Promise((resolve, reject) => {
      // Set a timeout to reject the promise if the wallet is not unlocked
      const timeout = setTimeout(() => {
        reject(new Error('Timeout unlocking the wallet'))
      }, UNLOCK_WALLET_TIMEOUT)

      super
        .activate()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeout)
        })
    })
  }
}
