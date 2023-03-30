import { ConnectorUpdate } from '@web3-react/types'
// tslint:disable-next-line
import type WalletConnectProvider from '@walletconnect/ethereum-provider'
import { AbstractConnector } from './AbstractConnector'
import { ChainId } from '@dcl/schemas'

export class WalletConnectV2Connector extends AbstractConnector {
  provider?: WalletConnectProvider

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const walletConnectProvider = await import('@walletconnect/ethereum-provider')

    this.provider = await walletConnectProvider.default.init({
      chains: [ChainId.ETHEREUM_MAINNET],
      projectId: '61570c542c2d66c659492e5b24a41522',
      showQrModal: true
    })

    const accounts = await this.provider.enable()

    return {
      account: accounts[0],
      chainId: this.provider.chainId,
      provider: this.provider
    }
  }

  getProvider = async (): Promise<any> => {
    throw new Error('Method not implemented.')
  }

  getChainId = async (): Promise<string | number> => {
    throw new Error('Method not implemented.')
  }

  getAccount = async (): Promise<string | null> => {
    throw new Error('Method not implemented.')
  }

  deactivate = (): void => {
    throw new Error('Method not implemented.')
  }
}
