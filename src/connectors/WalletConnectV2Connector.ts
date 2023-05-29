import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { ChainId } from '@dcl/schemas'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { ProviderAccounts } from '@walletconnect/ethereum-provider/dist/types/types'
import { Storage } from 'src/storage'

function getSupportedChainIds(chainId: ChainId) {
  switch (chainId) {
    case ChainId.ETHEREUM_MAINNET:
      return [ChainId.ETHEREUM_MAINNET, ChainId.MATIC_MAINNET]
    case ChainId.ETHEREUM_GOERLI:
      return [ChainId.ETHEREUM_GOERLI, ChainId.MATIC_MUMBAI]
    default:
      throw new Error(`Unsupported chainId ${chainId}`)
  }
}

export class WalletConnectV2Connector extends AbstractConnector {
  provider?: typeof EthereumProvider.prototype

  constructor(private desiredChainId: ChainId) {
    super({
      supportedChainIds: getSupportedChainIds(desiredChainId)
    })
  }

  static clearStorage = (storage: Storage) => {
    storage.removeRegExp(new RegExp('^wc@2:'))
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    this.provider = await EthereumProvider.init({
      projectId: '61570c542c2d66c659492e5b24a41522',
      chains: getSupportedChainIds(this.desiredChainId),
      showQrModal: true,
      qrModalOptions: {
        themeVariables: {
          '--w3m-z-index': '3000'
        }
      },
      methods: ['eth_signTypedData_v4', 'personal_sign', 'eth_sendTransaction'],
      events: ['accountsChanged', 'chainChanged', 'disconnect']
    })

    const accounts = await this.provider.enable()

    this.provider.on('accountsChanged', this.handleAccountsChanged)
    this.provider.on('chainChanged', this.handleChainChanged)
    this.provider.on('disconnect', this.handleDisconnect)

    return {
      chainId: this.provider.chainId,
      account: accounts[0],
      provider: this.provider
    }
  }

  getProvider = async (): Promise<any> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider.chainId
  }

  getAccount = async (): Promise<string | null> => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    return this.provider.accounts[0]
  }

  deactivate = (): void => {
    if (!this.provider) {
      return
    }

    this.emitDeactivate()

    this.provider
      .removeListener('accountsChanged', this.handleAccountsChanged)
      .removeListener('chainChanged', this.handleChainChanged)
      .removeListener('disconnect', this.handleDisconnect)
      .disconnect()
  }

  handleAccountsChanged = (accounts: ProviderAccounts): void => {
    this.emitUpdate({ account: accounts[0] })
  }

  handleChainChanged = (chainId: string | number): void => {
    this.emitUpdate({ chainId })
  }

  handleDisconnect = (): void => {
    if (!this.provider) {
      throw new Error('Provider is undefined')
    }

    this.deactivate()
  }
}
