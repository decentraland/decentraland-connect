import { ChainId } from '@dcl/schemas'
import { expect } from 'chai'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
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
          '10': 'https://rpc.decentraland.org/optimism?project=fortmatic',
          '42': 'https://rpc.decentraland.org/kovan?project=fortmatic',
          '56': 'https://rpc.decentraland.org/binance?project=fortmatic',
          '137': 'https://rpc.decentraland.org/polygon?project=fortmatic',
          '250': 'https://rpc.decentraland.org/fantom?project=fortmatic',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=fortmatic',
          '43114': 'https://rpc.decentraland.org/avalanche?project=fortmatic',
          '80001': 'https://rpc.decentraland.org/mumbai?project=fortmatic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=fortmatic'
        }
      },
      network: {
        urls: {
          [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet',
          [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia',
          [ChainId.ETHEREUM_ROPSTEN]: 'https://rpc.decentraland.org/ropsten',
          [ChainId.ETHEREUM_RINKEBY]: 'https://rpc.decentraland.org/rinkeby',
          [ChainId.ETHEREUM_GOERLI]: 'https://rpc.decentraland.org/goerli',
          [ChainId.ETHEREUM_KOVAN]: 'https://rpc.decentraland.org/kovan',
          [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon',
          [ChainId.MATIC_MUMBAI]: 'https://rpc.decentraland.org/mumbai',
          [ChainId.ARBITRUM_MAINNET]: 'https://rpc.decentraland.org/arbitrum',
          [ChainId.OPTIMISM_MAINNET]: 'https://rpc.decentraland.org/optimism',
          [ChainId.AVALANCHE_MAINNET]: 'https://rpc.decentraland.org/avalanche',
          [ChainId.BSC_MAINNET]: 'https://rpc.decentraland.org/binance',
          [ChainId.FANTOM_MAINNET]: 'https://rpc.decentraland.org/fantom'
        }
      },
      wallet_connect_v2: {
        projectId: '61570c542c2d66c659492e5b24a41522',
        chains: {
          '1': {
            chains: [1],
            optionalChains: [
              ChainId.MATIC_MAINNET,
              ChainId.ARBITRUM_MAINNET,
              ChainId.OPTIMISM_MAINNET,
              ChainId.AVALANCHE_MAINNET,
              ChainId.BSC_MAINNET,
              ChainId.FANTOM_MAINNET
            ]
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
          '10':
            'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
          '42': 'https://rpc.decentraland.org/kovan?project=walletconnect-v2',
          '56': 'https://rpc.decentraland.org/binance?project=walletconnect-v2',
          '11155111':
            'https://rpc.decentraland.org/sepolia?project=walletconnect-v2',
          '137':
            'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
          '250': 'https://rpc.decentraland.org/fantom?project=walletconnect-v2',
          '42161':
            'https://rpc.decentraland.org/arbitrum?project=walletconnect-v2',
          '43114':
            'https://rpc.decentraland.org/avalanche?project=walletconnect-v2',
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
          '10': 'https://rpc.decentraland.org/optimism?project=walletlink',
          '42': 'https://rpc.decentraland.org/kovan?project=walletlink',
          '56': 'https://rpc.decentraland.org/binance?project=walletlink',
          '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
          '250': 'https://rpc.decentraland.org/fantom?project=walletlink',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=walletlink',
          '43114': 'https://rpc.decentraland.org/avalanche?project=walletlink',
          '80001': 'https://rpc.decentraland.org/mumbai?project=walletlink',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink'
        }
      },
      magic: {
        apiKey: 'pk_live_212568025B158355',
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=magic',
          '3': 'https://rpc.decentraland.org/ropsten?project=magic',
          '4': 'https://rpc.decentraland.org/rinkeby?project=magic',
          '5': 'https://rpc.decentraland.org/goerli?project=magic',
          '10': 'https://rpc.decentraland.org/optimism?project=magic',
          '42': 'https://rpc.decentraland.org/kovan?project=magic',
          '56': 'https://rpc.decentraland.org/binance?project=magic',
          '137': 'https://rpc.decentraland.org/polygon?project=magic',
          '250': 'https://rpc.decentraland.org/fantom?project=magic',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=magic',
          '43114': 'https://rpc.decentraland.org/avalanche?project=magic',
          '80001': 'https://rpc.decentraland.org/mumbai?project=magic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=magic'
        },
        chains: [
          ChainId.ETHEREUM_MAINNET,
          ChainId.ETHEREUM_GOERLI,
          ChainId.ETHEREUM_SEPOLIA,
          ChainId.MATIC_MAINNET,
          ChainId.MATIC_MUMBAI,
          ChainId.ARBITRUM_MAINNET,
          ChainId.AVALANCHE_MAINNET,
          ChainId.BSC_MAINNET,
          ChainId.FANTOM_MAINNET
        ]
      }
    })
  })
})

describe('#getRpcUrls', () => {
  describe('when the provider type does not have a special treatment', () => {
    it('should return the rpc configurations', () => {
      expect(getRpcUrls(ProviderType.INJECTED)).to.deep.eq({
        '1': 'https://rpc.decentraland.org/mainnet',
        '3': 'https://rpc.decentraland.org/ropsten',
        '4': 'https://rpc.decentraland.org/rinkeby',
        '5': 'https://rpc.decentraland.org/goerli',
        '10': 'https://rpc.decentraland.org/optimism',
        '42': 'https://rpc.decentraland.org/kovan',
        '56': 'https://rpc.decentraland.org/binance',
        '137': 'https://rpc.decentraland.org/polygon',
        '250': 'https://rpc.decentraland.org/fantom',
        '42161': 'https://rpc.decentraland.org/arbitrum',
        '43114': 'https://rpc.decentraland.org/avalanche',
        '80001': 'https://rpc.decentraland.org/mumbai',
        '11155111': 'https://rpc.decentraland.org/sepolia'
      })
    })
  })

  describe('when the provider type is wallet connect 2', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_CONNECT_V2)).to.deep.eq({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
        '3': 'https://rpc.decentraland.org/ropsten?project=walletconnect-v2',
        '4': 'https://rpc.decentraland.org/rinkeby?project=walletconnect-v2',
        '5': 'https://rpc.decentraland.org/goerli?project=walletconnect-v2',
        '10': 'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
        '42': 'https://rpc.decentraland.org/kovan?project=walletconnect-v2',
        '56': 'https://rpc.decentraland.org/binance?project=walletconnect-v2',
        '137': 'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
        '250': 'https://rpc.decentraland.org/fantom?project=walletconnect-v2',
        '42161':
          'https://rpc.decentraland.org/arbitrum?project=walletconnect-v2',
        '43114':
          'https://rpc.decentraland.org/avalanche?project=walletconnect-v2',
        '80001': 'https://rpc.decentraland.org/mumbai?project=walletconnect-v2',
        '11155111':
          'https://rpc.decentraland.org/sepolia?project=walletconnect-v2'
      })
    })
  })

  describe('when the provider type is wallet link', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_LINK)).to.deep.eq({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletlink',
        '3': 'https://rpc.decentraland.org/ropsten?project=walletlink',
        '4': 'https://rpc.decentraland.org/rinkeby?project=walletlink',
        '5': 'https://rpc.decentraland.org/goerli?project=walletlink',
        '10': 'https://rpc.decentraland.org/optimism?project=walletlink',
        '42': 'https://rpc.decentraland.org/kovan?project=walletlink',
        '56': 'https://rpc.decentraland.org/binance?project=walletlink',
        '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
        '250': 'https://rpc.decentraland.org/fantom?project=walletlink',
        '42161': 'https://rpc.decentraland.org/arbitrum?project=walletlink',
        '43114': 'https://rpc.decentraland.org/avalanche?project=walletlink',
        '80001': 'https://rpc.decentraland.org/mumbai?project=walletlink',
        '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink'
      })
    })
  })
})
