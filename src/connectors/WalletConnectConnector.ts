import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { IWalletConnectProviderOptions } from '@walletconnect/types'

import { getConfiguration } from '../configuration'

export const URI_AVAILABLE = 'URI_AVAILABLE'

export interface WalletConnectConnectorArguments extends IWalletConnectProviderOptions {
  supportedChainIds?: number[]
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

function getSupportedChains({ supportedChainIds, rpc }: WalletConnectConnectorArguments): number[] | undefined {
  if (supportedChainIds) {
    return supportedChainIds
  }

  return rpc ? Object.keys(rpc).map((k) => Number(k)) : undefined
}

export class BaseWalletConnectConnector extends AbstractConnector {
  public static isEnabling?: boolean = false
  public walletConnectProvider?: any

  private readonly config: WalletConnectConnectorArguments

  constructor(config: WalletConnectConnectorArguments) {
    super({ supportedChainIds: getSupportedChains(config) })

    this.config = config

    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleDisconnect = this.handleDisconnect.bind(this)
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.walletConnectProvider) {
      const WalletConnectProvider = await import('@walletconnect/web3-provider').then((m) => m?.default ?? m)
      this.walletConnectProvider = new WalletConnectProvider(this.config)
    }

    let account = ''
    if (!BaseWalletConnectConnector.isEnabling) {
      BaseWalletConnectConnector.isEnabling = true

      account = await this.walletConnectProvider
        .enable()
        .then((accounts: string[]): string => accounts[0])
        .catch((error: Error): void => {
          // TODO ideally this would be a better check
          if (error.message === 'User closed modal') {
            throw new UserRejectedRequestError()
          }

          throw error
        })
        .finally(() => {
          BaseWalletConnectConnector.isEnabling = false
        })
    }

    this.walletConnectProvider.on('disconnect', this.handleDisconnect)
    this.walletConnectProvider.on('chainChanged', this.handleChainChanged)
    this.walletConnectProvider.on('accountsChanged', this.handleAccountsChanged)

    return { provider: this.walletConnectProvider, account }
  }

  public async getProvider(): Promise<any> {
    return this.walletConnectProvider
  }

  public async getChainId(): Promise<number | string> {
    return this.walletConnectProvider.send('eth_chainId')
  }

  public async getAccount(): Promise<null | string> {
    return this.walletConnectProvider.send('eth_accounts').then((accounts: string[]): string => accounts[0])
  }

  public deactivate() {
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('disconnect', this.handleDisconnect)
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
    }
  }

  public async close() {
    await this.walletConnectProvider?.close()
  }

  private handleChainChanged(chainId: number | string): void {
    this.emitUpdate({ chainId })
  }

  private handleAccountsChanged(accounts: string[]): void {
    this.emitUpdate({ account: accounts[0] })
  }

  private handleDisconnect(): void {
    this.emitDeactivate()
    // we have to do this because of a @walletconnect/web3-provider bug
    if (this.walletConnectProvider) {
      this.walletConnectProvider.stop()
      this.walletConnectProvider.removeListener('chainChanged', this.handleChainChanged)
      this.walletConnectProvider.removeListener('accountsChanged', this.handleAccountsChanged)
      this.walletConnectProvider = undefined
    }

    this.emitDeactivate()
  }
}

export class WalletConnectConnector extends BaseWalletConnectConnector {
  params: {
    rpc: Record<number, string>
    qrcode: boolean
    pollingInterval: number
  }

  constructor() {
    const { urls } = getConfiguration()[ProviderType.WALLET_CONNECT]
    const params = {
      rpc: urls,
      qrcode: true,
      pollingInterval: 150000
    }

    super(params)
    this.params = params
  }

  public async getRpc(): Promise<string> {
    const chainId = await this.getChainId()
    return this.params.rpc[chainId]
  }

  public getQrCode(): boolean {
    return this.params.qrcode
  }

  public getPollingInterval(): number {
    return this.params.pollingInterval
  }
}
