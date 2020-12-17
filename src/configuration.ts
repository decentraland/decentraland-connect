import { ChainId, ProviderType } from './types'

const configuration = Object.freeze({
  storageKey: 'some-random-key',

  [ProviderType.INJECTED]: {},
  [ProviderType.FORTMATIC]: {
    apiKeys: {
      [ChainId.MAINNET]: 'pk_live_D7297F51E9776DD2',
      [ChainId.ROPSTEN]: 'pk_test_198DDD3CA646DE2F',
      [ChainId.RINKEBY]: 'pk_test_198DDD3CA646DE2F',
      [ChainId.KOVAN]: 'pk_test_198DDD3CA646DE2F'
    }
  },
  [ProviderType.WALLET_CONNECT]: {
    bridge: 'https://bridge.walletconnect.org',
    urls: {
      [ChainId.MAINNET]: 'https://',
      [ChainId.ROPSTEN]: 'https://',
      [ChainId.RINKEBY]: 'https://',
      [ChainId.KOVAN]: 'https://'
    }
  }
})

export function getConfiguration() {
  return configuration
}
