import { expect } from 'chai'
import { getConfiguration } from '../src/configuration'
import { ChainId, ProviderType } from '../src/types'

describe('#getConfiguration', () => {
  it('should return the configuration using the environment', () => {
    expect(getConfiguration()).to.deep.eq({
      storageKey: 'decentraland-connect-storage-key',

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
