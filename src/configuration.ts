import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'

const configuration = Object.freeze({
  storageKey: 'decentraland-connect-storage-key',

  [ProviderType.INJECTED]: {},

  [ProviderType.FORTMATIC]: {
    apiKeys: {
      [ChainId.ETHEREUM_MAINNET]: 'pk_live_F8E24DF8DD5BCBC5',
      [ChainId.ETHEREUM_ROPSTEN]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_RINKEBY]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_KOVAN]: 'pk_test_5B728BEFE5C10911'
    }
  },

  [ProviderType.WALLET_CONNECT]: {
    urls: getRpcUrls()
  }
})

export function getConfiguration() {
  return configuration
}

export function getRpcUrls() {
  return {
    [ChainId.ETHEREUM_MAINNET]:
      'https://mainnet.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
    [ChainId.ETHEREUM_ROPSTEN]:
      'https://ropsten.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
    [ChainId.ETHEREUM_RINKEBY]:
      'https://rinkeby.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
    [ChainId.ETHEREUM_GOERLI]:
      'https://goerli.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
    [ChainId.ETHEREUM_KOVAN]:
      'https://kovan.infura.io/v3/21ee2680fd58460ba96d2b3addd7c38c',
    [ChainId.MATIC_MAINNET]:
      'https://rpc-mainnet.maticvigil.com/v1/aad675783e3f73a13efbf6e95338d6de7fd5c9b9',
    [ChainId.MATIC_MUMBAI]:
      'https://rpc-mumbai.maticvigil.com/v1/aad675783e3f73a13efbf6e95338d6de7fd5c9b9'
  }
}
