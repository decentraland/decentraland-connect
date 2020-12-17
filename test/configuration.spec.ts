import { expect } from 'chai'
import { getConfiguration } from '../src/configuration'
import { ChainId, ProviderType } from '../src/types'

describe('#getConfiguration', () => {
  let env: NodeJS.ProcessEnv = process.env

  after(() => {
    process.env = env
  })

  it('should return the configuration using the environment', () => {
    process.env = {
      STORAGE_KEY: 'storage-key',

      FORTMATIC_TEST_KEY: 'pk_test_198DDD3CA646DE2F',
      FORTMATIC_LIVE_KEY: 'pk_live_D7297F51E9776DD2',

      WALLET_CONNECT_TEST_RPC: 'https://ropsten.mycustomnode.com',
      WALLET_CONNECT_LIVE_RPC: 'https://mainnet.mycustomnode.com'
    }

    expect(getConfiguration()).to.deep.eq({
      storageKey: 'storage-key',

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
        urls: {
          [ChainId.MAINNET]: 'https://mainnet.mycustomnode.com',
          [ChainId.ROPSTEN]: 'https://ropsten.mycustomnode.com',
          [ChainId.RINKEBY]: 'https://ropsten.mycustomnode.com',
          [ChainId.KOVAN]: 'https://ropsten.mycustomnode.com'
        }
      }
    })
  })
})
