import { ChainId } from '@dcl/schemas'
import { expect } from 'chai'
import { getConfiguration } from '../src/configuration'
import { ProviderType } from '../src/types'

describe('#getConfiguration', () => {
  it('should return the configuration using the environment', () => {
    expect(getConfiguration()).to.deep.eq({
      storageKey: 'decentraland-connect-storage-key',

      [ProviderType.INJECTED]: {},
      [ProviderType.FORTMATIC]: {
        apiKeys: {
          [ChainId.ETHEREUM_MAINNET]: 'pk_live_D7297F51E9776DD2',
          [ChainId.ETHEREUM_ROPSTEN]: 'pk_test_198DDD3CA646DE2F',
          [ChainId.ETHEREUM_RINKEBY]: 'pk_test_198DDD3CA646DE2F',
          [ChainId.ETHEREUM_KOVAN]: 'pk_test_198DDD3CA646DE2F'
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
  })
})
