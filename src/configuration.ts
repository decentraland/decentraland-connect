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
    urls: {
      [ChainId.ETHEREUM_MAINNET]:
        'https://mainnet.infura.io/v3/fa3357a65e2d4214ac735190646a3c53',
      [ChainId.ETHEREUM_ROPSTEN]:
        'https://ropsten.infura.io/v3/fa3357a65e2d4214ac735190646a3c53',
      [ChainId.ETHEREUM_RINKEBY]:
        'https://rinkeby.infura.io/v3/fa3357a65e2d4214ac735190646a3c53',
      [ChainId.ETHEREUM_KOVAN]:
        'https://kovan.infura.io/v3/fa3357a65e2d4214ac735190646a3c53'
    }
  }
})

export function getConfiguration() {
  return configuration
}
