import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { InjectedConnector as BaseInjectedConnector } from '@web3-react/injected-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { ErrorUnlockingWallet } from '../types'

const UNLOCK_WALLET_TIMEOUT = 60 * 1000 // 60 seconds

export class InjectedConnector extends BaseInjectedConnector {
  constructor(chainId: ChainId) {
    super({
      supportedChainIds: [chainId]
    })
  }

  async activate(): Promise<ConnectorUpdate> {
    // Set a timeout to reject the promise if the wallet is not unlocked
    const timeoutPromise = new Promise<ConnectorUpdate>((_, reject) => {
      setTimeout(() => {
        reject(new ErrorUnlockingWallet())
      }, UNLOCK_WALLET_TIMEOUT)
    })

    const activatePromise = super.activate()

    return Promise.race([activatePromise, timeoutPromise])
  }
}
