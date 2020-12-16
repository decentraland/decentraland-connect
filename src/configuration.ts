import { ChainId, ProviderType } from './types'

export function getConfiguration() {
  return {
    storageKey: 'some-random-key',

    [ProviderType.INJECTED]: {},
    [ProviderType.FORTMATIC]: {
      apiKey: 'pk_test_20CFAD4A5A9FBF64'
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
  }
}
