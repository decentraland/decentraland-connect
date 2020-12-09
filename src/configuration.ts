import { ChainId, ProviderType } from './types'

export function getConfiguration() {
  return {
    [ProviderType.METAMASK]: {},
    [ProviderType.FORMATIC]: {
      apiKey: 'FORMATIC_API_KEY'
    },
    [ProviderType.WALLET_CONNECT]: {
      urls: {
        [ChainId.MAINNET]: 'https://',
        [ChainId.ROPSTEN]: 'https://',
        [ChainId.RINKEBY]: 'https://',
        [ChainId.KOVAN]: 'https://'
      }
    }
  }
}
