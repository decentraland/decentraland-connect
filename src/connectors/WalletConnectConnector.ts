import { WalletConnectConnector as BaseWalletConnectConnector } from '@web3-react/walletconnect-connector'
import { getConfiguration } from '../configuration'
import { ChainId, ProviderType } from '../types'

export class WalletConnectConnector extends BaseWalletConnectConnector {
  params: {
    rpc: Record<number, string>
    qrcode: boolean
    pollingInterval: number
  }

  constructor(chainId: ChainId) {
    const { urls } = getConfiguration()[ProviderType.WALLET_CONNECT]
    const params = {
      rpc: { [chainId]: urls[chainId] },
      qrcode: true,
      pollingInterval: 15000
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
