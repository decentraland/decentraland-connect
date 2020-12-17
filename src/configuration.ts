import { ChainId, ProviderType } from './types'

export function getConfiguration() {
  return {
    storageKey: getEnv('STORAGE_KEY'),

    [ProviderType.INJECTED]: {},

    [ProviderType.FORTMATIC]: {
      apiKeys: {
        [ChainId.MAINNET]: getEnv('FORTMATIC_LIVE_KEY'),
        [ChainId.ROPSTEN]: getEnv('FORTMATIC_TEST_KEY'),
        [ChainId.RINKEBY]: getEnv('FORTMATIC_TEST_KEY'),
        [ChainId.KOVAN]: getEnv('FORTMATIC_TEST_KEY')
      }
    },

    [ProviderType.WALLET_CONNECT]: {
      urls: {
        [ChainId.MAINNET]: getEnv('WALLET_CONNECT_LIVE_RPC'),
        [ChainId.ROPSTEN]: getEnv('WALLET_CONNECT_TEST_RPC'),
        [ChainId.RINKEBY]: getEnv('WALLET_CONNECT_TEST_RPC'),
        [ChainId.KOVAN]: getEnv('WALLET_CONNECT_TEST_RPC')
      }
    }
  }
}

function getEnv(key: string): string {
  return process.env[key] || ''
}
