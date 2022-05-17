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

describe('#getRpcUrls', () => {
  describe('when the provider type does not have a special treatment', () => {
    it('should return the rpc configurations', () => {
      expect(getRpcUrls(ProviderType.INJECTED)).to.deep.eq({
        1: 'https://rpc.decentraland.org/mainnet',
        3: 'https://rpc.decentraland.org/ropsten',
        4: 'https://rpc.decentraland.org/rinkeby',
        5: 'https://rpc.decentraland.org/goerli',
        42: 'https://rpc.decentraland.org/kovan',
        137: 'https://rpc.decentraland.org/polygon',
        80001: 'https://rpc.decentraland.org/mumbai'
      })
    })
  })

  describe('when the provider type is wallet connect', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_CONNECT)).to.deep.eq({
        1: 'https://rpc.decentraland.org/mainnet?project=walletconnect',
        3: 'https://rpc.decentraland.org/ropsten?project=walletconnect',
        4: 'https://rpc.decentraland.org/rinkeby?project=walletconnect',
        5: 'https://rpc.decentraland.org/goerli?project=walletconnect',
        42: 'https://rpc.decentraland.org/kovan?project=walletconnect',
        137: 'https://rpc.decentraland.org/polygon?project=walletconnect',
        80001: 'https://rpc.decentraland.org/mumbai?project=walletconnect'
      })
    })
  })

  describe('when the provider type is wallet link', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_LINK)).to.deep.eq({
        1: 'https://rpc.decentraland.org/mainnet?project=walletlink',
        3: 'https://rpc.decentraland.org/ropsten?project=walletlink',
        4: 'https://rpc.decentraland.org/rinkeby?project=walletlink',
        5: 'https://rpc.decentraland.org/goerli?project=walletlink',
        42: 'https://rpc.decentraland.org/kovan?project=walletlink',
        137: 'https://rpc.decentraland.org/polygon?project=walletlink',
        80001: 'https://rpc.decentraland.org/mumbai?project=walletlink'
      })
    })
  })
})
