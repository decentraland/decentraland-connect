import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { expect } from 'chai'
import { getConfiguration, getRpcUrls } from '../src/configuration'

describe('#getConfiguration', () => {
  it('should return the configuration using the environment', () => {
    expect(getConfiguration()).to.deep.eq({
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
        urls: getRpcUrls(ProviderType.WALLET_CONNECT)
      }
    })
  })
})
