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
          '11155111': 'pk_test_5B728BEFE5C10911'
        },
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=fortmatic',
          '10': 'https://rpc.decentraland.org/optimism?project=fortmatic',
          '56': 'https://rpc.decentraland.org/binance?project=fortmatic',
          '137': 'https://rpc.decentraland.org/polygon?project=fortmatic',
          '250': 'https://rpc.decentraland.org/fantom?project=fortmatic',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=fortmatic',
          '43114': 'https://rpc.decentraland.org/avalanche?project=fortmatic',
          '80002': 'https://rpc.decentraland.org/amoy?project=fortmatic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=fortmatic'
        }
      },
      network: {
        urls: {
          [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet',
          [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia',
          [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon',
          [ChainId.MATIC_AMOY]: 'https://rpc.decentraland.org/amoy',
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
            chains: [ChainId.ETHEREUM_MAINNET],
            optionalChains: [
              ChainId.MATIC_MAINNET,
              ChainId.ARBITRUM_MAINNET,
              ChainId.OPTIMISM_MAINNET,
              ChainId.AVALANCHE_MAINNET,
              ChainId.BSC_MAINNET,
              ChainId.FANTOM_MAINNET
            ]
          },
          '11155111': {
            chains: [ChainId.ETHEREUM_SEPOLIA],
            optionalChains: [ChainId.MATIC_AMOY]
          }
        },
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
          '10':
            'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
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
          '80002': 'https://rpc.decentraland.org/amoy?project=walletconnect-v2'
        }
      },
      wallet_link: {
        appName: 'Decentraland',
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletlink',
          '10': 'https://rpc.decentraland.org/optimism?project=walletlink',
          '56': 'https://rpc.decentraland.org/binance?project=walletlink',
          '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
          '250': 'https://rpc.decentraland.org/fantom?project=walletlink',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=walletlink',
          '43114': 'https://rpc.decentraland.org/avalanche?project=walletlink',
          '80002': 'https://rpc.decentraland.org/amoy?project=walletlink',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink'
        }
      },
      magic: {
        apiKey: 'pk_live_212568025B158355',
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=magic',
          '10': 'https://rpc.decentraland.org/optimism?project=magic',
          '56': 'https://rpc.decentraland.org/binance?project=magic',
          '137': 'https://rpc.decentraland.org/polygon?project=magic',
          '250': 'https://rpc.decentraland.org/fantom?project=magic',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=magic',
          '43114': 'https://rpc.decentraland.org/avalanche?project=magic',
          '80002': 'https://rpc.decentraland.org/amoy?project=magic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=magic'
        },
        chains: [
          ChainId.ETHEREUM_MAINNET,
          ChainId.ETHEREUM_SEPOLIA,
          ChainId.MATIC_MAINNET,
          ChainId.MATIC_AMOY,
          ChainId.OPTIMISM_MAINNET,
          ChainId.ARBITRUM_MAINNET,
          ChainId.AVALANCHE_MAINNET,
          ChainId.BSC_MAINNET,
          ChainId.FANTOM_MAINNET
        ]
      },
      magic_test: {
        apiKey: 'pk_live_CE856A4938B36648',
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=magic',
          '10': 'https://rpc.decentraland.org/optimism?project=magic',
          '56': 'https://rpc.decentraland.org/binance?project=magic',
          '137': 'https://rpc.decentraland.org/polygon?project=magic',
          '250': 'https://rpc.decentraland.org/fantom?project=magic',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=magic',
          '43114': 'https://rpc.decentraland.org/avalanche?project=magic',
          '80002': 'https://rpc.decentraland.org/amoy?project=magic',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=magic'
        },
        chains: [
          ChainId.ETHEREUM_MAINNET,
          ChainId.ETHEREUM_SEPOLIA,
          ChainId.MATIC_MAINNET,
          ChainId.MATIC_AMOY,
          ChainId.OPTIMISM_MAINNET,
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
        '10': 'https://rpc.decentraland.org/optimism',
        '56': 'https://rpc.decentraland.org/binance',
        '137': 'https://rpc.decentraland.org/polygon',
        '250': 'https://rpc.decentraland.org/fantom',
        '42161': 'https://rpc.decentraland.org/arbitrum',
        '43114': 'https://rpc.decentraland.org/avalanche',
        '80002': 'https://rpc.decentraland.org/amoy',
        '11155111': 'https://rpc.decentraland.org/sepolia'
      })
    })
  })

  describe('when the provider type is wallet connect 2', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_CONNECT_V2)).to.deep.eq({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
        '10': 'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
        '56': 'https://rpc.decentraland.org/binance?project=walletconnect-v2',
        '137': 'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
        '250': 'https://rpc.decentraland.org/fantom?project=walletconnect-v2',
        '42161':
          'https://rpc.decentraland.org/arbitrum?project=walletconnect-v2',
        '43114':
          'https://rpc.decentraland.org/avalanche?project=walletconnect-v2',
        '80002': 'https://rpc.decentraland.org/amoy?project=walletconnect-v2',
        '11155111':
          'https://rpc.decentraland.org/sepolia?project=walletconnect-v2'
      })
    })
  })

  describe('when the provider type is wallet link', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_LINK)).to.deep.eq({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletlink',
        '10': 'https://rpc.decentraland.org/optimism?project=walletlink',
        '56': 'https://rpc.decentraland.org/binance?project=walletlink',
        '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
        '250': 'https://rpc.decentraland.org/fantom?project=walletlink',
        '42161': 'https://rpc.decentraland.org/arbitrum?project=walletlink',
        '43114': 'https://rpc.decentraland.org/avalanche?project=walletlink',
        '80002': 'https://rpc.decentraland.org/amoy?project=walletlink',
        '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink'
      })
    })
  })
})
