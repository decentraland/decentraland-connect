import { WalletConnectConnector as BaseWalletConnectConnector } from '@web3-react/walletconnect-connector'
import { getConfiguration } from '../configuration'
import { ChainId, ProviderType } from '../types'

export class WalletConnectConnector extends BaseWalletConnectConnector {
  constructor(chainId: ChainId) {
    const { bridge, urls } = getConfiguration()[ProviderType.WALLET_CONNECT]

    super({
      rpc: { [chainId]: urls[chainId] },
      bridge,
      qrcode: true,
      pollingInterval: 15000
    })
  }
}
