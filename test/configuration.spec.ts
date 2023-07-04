import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { expect } from 'chai'
import { getConfiguration, getRpcUrls } from '../src/configuration'

describe('#getConfiguration', () => {
  it('should return the configuration using the environment', () => {
    expect(getConfiguration()).to.deep.eq({
      storageKey: 'decentraland-connect-storage-key',
      injected: {},
      formatic: {
        apiKeys: {
          '1': 'pk_live_F8E24DF8DD5BCBC5',
          '3': 'pk_test_5B728BEFE5C10911',
          '4': 'pk_test_5B728BEFE5C10911',
          '5': 'pk_test_5B728BEFE5C10911',
          '42': 'pk_test_5B728BEFE5C10911',
          '11155111': 'pk_test_5B728BEFE5C10911'
        },
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=fortmatic',
          '3': 'https://rpc.decentraland.org/ropsten?project=fortmatic',
          '4': 'https://rpc.decentraland.org/rinkeby?project=fortmatic',
          '5': 'https://rpc.decentraland.org/goerli?project=fortmatic',
          '42': 'https://rpc.decentraland.org/kovan?project=fortmatic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=fortmatic',
          '137': 'https://rpc.decentraland.org/polygon?project=fortmatic',
          '80001': 'https://rpc.decentraland.org/mumbai?project=fortmatic',
        }
      },
      network: {
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet',
          '3': 'https://rpc.decentraland.org/ropsten',
          '4': 'https://rpc.decentraland.org/rinkeby',
          '5': 'https://rpc.decentraland.org/goerli',
          '42': 'https://rpc.decentraland.org/kovan',
          '11155111': 'https://rpc.decentraland.org/sepolia',
          '137': 'https://rpc.decentraland.org/polygon',
          '80001': 'https://rpc.decentraland.org/mumbai'
        }
      },
      wallet_connect: {
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect',
          '3': 'https://rpc.decentraland.org/ropsten?project=walletconnect',
          '4': 'https://rpc.decentraland.org/rinkeby?project=walletconnect',
          '5': 'https://rpc.decentraland.org/goerli?project=walletconnect',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletconnect',
          '42': 'https://rpc.decentraland.org/kovan?project=walletconnect',
          '137': 'https://rpc.decentraland.org/polygon?project=walletconnect',
          '80001': 'https://rpc.decentraland.org/mumbai?project=walletconnect'
        }
      },
      wallet_connect_v2: {
        projectId: '61570c542c2d66c659492e5b24a41522',
        chains: {
          '1': {
            chains: [1],
            optionalChains: [137]
          },
          '5': {
            chains: [5],
            optionalChains: [80001]
          },
          '11155111': {
            chains: [11155111],
            optionalChains: [80001]
          }
        },
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
          '3': 'https://rpc.decentraland.org/ropsten?project=walletconnect-v2',
          '4': 'https://rpc.decentraland.org/rinkeby?project=walletconnect-v2',
          '5': 'https://rpc.decentraland.org/goerli?project=walletconnect-v2',
          '42': 'https://rpc.decentraland.org/kovan?project=walletconnect-v2',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletconnect-v2',
          '137':
            'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
          '80001':
            'https://rpc.decentraland.org/mumbai?project=walletconnect-v2'
        }
      },
      wallet_link: {
        appName: 'Decentraland',
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletlink',
          '3': 'https://rpc.decentraland.org/ropsten?project=walletlink',
          '4': 'https://rpc.decentraland.org/rinkeby?project=walletlink',
          '5': 'https://rpc.decentraland.org/goerli?project=walletlink',
          '42': 'https://rpc.decentraland.org/kovan?project=walletlink',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink',
          '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
          '80001': 'https://rpc.decentraland.org/mumbai?project=walletlink'
        }
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
        11155111: 'https://rpc.decentraland.org/sepolia',
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
        11155111: 'https://rpc.decentraland.org/sepolia?project=walletconnect',
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
        11155111: 'https://rpc.decentraland.org/sepolia?project=walletlink',
        137: 'https://rpc.decentraland.org/polygon?project=walletlink',
        80001: 'https://rpc.decentraland.org/mumbai?project=walletlink'
      })
    })
  })
})
