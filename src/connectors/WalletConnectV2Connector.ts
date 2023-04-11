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
    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    if (!this.provider) {
      throw new Error('Provider not set.')
    }

    return this.provider.request({ method: 'eth_chainId' })
  }

  getAccount = async (): Promise<string | null> => {
    if (!this.provider) {
      throw new Error('Provider not set.')
    }

    return this.provider
      .request<string[]>({ method: 'eth_accounts' })
      .then(accounts => accounts[0])
  }

  deactivate = async (): Promise<void> => {
    if (this.provider) {
      await this.provider.disconnect()

      this.provider.removeListener(
        'disconnect',
        this.handleDisconnect
      )
      this.provider.removeListener(
        'chainChanged',
        this.handleChainChanged
      )

      this.provider.removeListener(
        'accountsChanged',
        this.handleAccountsChanged
      )
    }
  }

  private handleChainChanged = (chainId: number | string): void => {
    this.emitUpdate({ chainId })
  }

  private handleAccountsChanged = (accounts: string[]): void => {
    this.emitUpdate({ account: accounts[0] })
  }

  private handleDisconnect = async (): Promise<void> => {
    this.emitDeactivate()
    // we have to do this because of a @walletconnect/web3-provider bug
    if (this.provider) {
      await this.provider.disconnect()

      this.provider.removeListener(
        'chainChanged',
        this.handleChainChanged
      )

      this.provider.removeListener(
        'accountsChanged',
        this.handleAccountsChanged
      )

      this.provider = undefined
    }

    this.emitDeactivate()
  }
}
