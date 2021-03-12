import { ChainId } from '@dcl/schemas'
import { ProviderType } from './types'

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
      [ChainId.ETHEREUM_MAINNET]: 'https://mainnet.mycustomnode.com',
      [ChainId.ETHEREUM_ROPSTEN]: 'https://ropsten.mycustomnode.com',
      [ChainId.ETHEREUM_RINKEBY]: 'https://ropsten.mycustomnode.com',
      [ChainId.ETHEREUM_KOVAN]: 'https://ropsten.mycustomnode.com'
    }
  }
})

export function getConfiguration() {
  return configuration
}
