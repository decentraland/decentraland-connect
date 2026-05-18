/* eslint-disable @typescript-eslint/naming-convention */
import { ChainId } from '@dcl/schemas'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { getConfiguration, getRpcUrls } from '../src/configuration'

describe('#getConfiguration', () => {
  it('should return the configuration using the environment', () => {
    expect(getConfiguration()).toEqual({
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
          '11155111': 'https://rpc.decentraland.org/sepolia?project=fortmatic',
          '33139': 'https://rpc.apechain.com/http?project=fortmatic',
          '33111': 'https://curtis.rpc.caldera.xyz/http?project=fortmatic',
          '8453': 'https://mainnet.base.org?project=fortmatic',
          '84532': 'https://sepolia.base.org?project=fortmatic',
          '10143': 'https://testnet-rpc.monad.xyz?project=fortmatic'
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
          [ChainId.FANTOM_MAINNET]: 'https://rpc.decentraland.org/fantom',
          33139: 'https://rpc.apechain.com/http',
          33111: 'https://curtis.rpc.caldera.xyz/http',
          8453: 'https://mainnet.base.org',
          84532: 'https://sepolia.base.org',
          10143: 'https://testnet-rpc.monad.xyz'
        }
      },
      wallet_connect_v2: {
        projectId: '61570c542c2d66c659492e5b24a41522',
        chains: [
          ChainId.ETHEREUM_MAINNET,
          ChainId.ETHEREUM_SEPOLIA,
          ChainId.MATIC_MAINNET,
          ChainId.MATIC_AMOY,
          ChainId.ARBITRUM_MAINNET,
          ChainId.OPTIMISM_MAINNET,
          ChainId.AVALANCHE_MAINNET,
          ChainId.BSC_MAINNET,
          ChainId.FANTOM_MAINNET
        ],
        urls: {
          '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
          '10': 'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
          '56': 'https://rpc.decentraland.org/binance?project=walletconnect-v2',
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletconnect-v2',
          '137': 'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
          '250': 'https://rpc.decentraland.org/fantom?project=walletconnect-v2',
          '42161': 'https://rpc.decentraland.org/arbitrum?project=walletconnect-v2',
          '43114': 'https://rpc.decentraland.org/avalanche?project=walletconnect-v2',
          '80002': 'https://rpc.decentraland.org/amoy?project=walletconnect-v2',
          '33139': 'https://rpc.apechain.com/http?project=walletconnect-v2',
          '33111': 'https://curtis.rpc.caldera.xyz/http?project=walletconnect-v2',
          '8453': 'https://mainnet.base.org?project=walletconnect-v2',
          '84532': 'https://sepolia.base.org?project=walletconnect-v2',
          '10143': 'https://testnet-rpc.monad.xyz?project=walletconnect-v2'
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
          '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink',
          '33139': 'https://rpc.apechain.com/http?project=walletlink',
          '33111': 'https://curtis.rpc.caldera.xyz/http?project=walletlink',
          '8453': 'https://mainnet.base.org?project=walletlink',
          '84532': 'https://sepolia.base.org?project=walletlink',
          '10143': 'https://testnet-rpc.monad.xyz?project=walletlink'
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
          '11155111': 'https://rpc.decentraland.org/sepolia?project=magic',
          '33139': 'https://rpc.apechain.com/http?project=magic',
          '33111': 'https://curtis.rpc.caldera.xyz/http?project=magic',
          '8453': 'https://mainnet.base.org?project=magic',
          '84532': 'https://sepolia.base.org?project=magic',
          '10143': 'https://testnet-rpc.monad.xyz?project=magic'
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
          '11155111': 'https://rpc.decentraland.org/sepolia?project=magic',
          '33139': 'https://rpc.apechain.com/http?project=magic',
          '33111': 'https://curtis.rpc.caldera.xyz/http?project=magic',
          '8453': 'https://mainnet.base.org?project=magic',
          '84532': 'https://sepolia.base.org?project=magic',
          '10143': 'https://testnet-rpc.monad.xyz?project=magic'
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
      thirdweb: {
        clientId: 'e1adce863fe287bb6cf0e3fd90bdb77f',
        chains: [ChainId.ETHEREUM_MAINNET, ChainId.ETHEREUM_SEPOLIA, ChainId.MATIC_MAINNET, ChainId.MATIC_AMOY]
      }
    })
  })
})

describe('#getRpcUrls', () => {
  describe('when the provider type does not have a special treatment', () => {
    it('should return the rpc configurations', () => {
      expect(getRpcUrls(ProviderType.INJECTED)).toEqual({
        '1': 'https://rpc.decentraland.org/mainnet',
        '10': 'https://rpc.decentraland.org/optimism',
        '56': 'https://rpc.decentraland.org/binance',
        '137': 'https://rpc.decentraland.org/polygon',
        '250': 'https://rpc.decentraland.org/fantom',
        '42161': 'https://rpc.decentraland.org/arbitrum',
        '43114': 'https://rpc.decentraland.org/avalanche',
        '80002': 'https://rpc.decentraland.org/amoy',
        '11155111': 'https://rpc.decentraland.org/sepolia',
        '33139': 'https://rpc.apechain.com/http',
        '33111': 'https://curtis.rpc.caldera.xyz/http',
        '8453': 'https://mainnet.base.org',
        '84532': 'https://sepolia.base.org',
        '10143': 'https://testnet-rpc.monad.xyz'
      })
    })
  })

  describe('when the provider type is wallet connect 2', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_CONNECT_V2)).toEqual({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2',
        '10': 'https://rpc.decentraland.org/optimism?project=walletconnect-v2',
        '56': 'https://rpc.decentraland.org/binance?project=walletconnect-v2',
        '137': 'https://rpc.decentraland.org/polygon?project=walletconnect-v2',
        '250': 'https://rpc.decentraland.org/fantom?project=walletconnect-v2',
        '42161': 'https://rpc.decentraland.org/arbitrum?project=walletconnect-v2',
        '43114': 'https://rpc.decentraland.org/avalanche?project=walletconnect-v2',
        '80002': 'https://rpc.decentraland.org/amoy?project=walletconnect-v2',
        '11155111': 'https://rpc.decentraland.org/sepolia?project=walletconnect-v2',
        '33139': 'https://rpc.apechain.com/http?project=walletconnect-v2',
        '33111': 'https://curtis.rpc.caldera.xyz/http?project=walletconnect-v2',
        '8453': 'https://mainnet.base.org?project=walletconnect-v2',
        '84532': 'https://sepolia.base.org?project=walletconnect-v2',
        '10143': 'https://testnet-rpc.monad.xyz?project=walletconnect-v2'
      })
    })
  })

  describe('when the provider type is wallet link', () => {
    it('should return the rpc configurations appending the project query string', () => {
      expect(getRpcUrls(ProviderType.WALLET_LINK)).toEqual({
        '1': 'https://rpc.decentraland.org/mainnet?project=walletlink',
        '10': 'https://rpc.decentraland.org/optimism?project=walletlink',
        '56': 'https://rpc.decentraland.org/binance?project=walletlink',
        '137': 'https://rpc.decentraland.org/polygon?project=walletlink',
        '250': 'https://rpc.decentraland.org/fantom?project=walletlink',
        '42161': 'https://rpc.decentraland.org/arbitrum?project=walletlink',
        '43114': 'https://rpc.decentraland.org/avalanche?project=walletlink',
        '80002': 'https://rpc.decentraland.org/amoy?project=walletlink',
        '11155111': 'https://rpc.decentraland.org/sepolia?project=walletlink',
        '33139': 'https://rpc.apechain.com/http?project=walletlink',
        '33111': 'https://curtis.rpc.caldera.xyz/http?project=walletlink',
        '8453': 'https://mainnet.base.org?project=walletlink',
        '84532': 'https://sepolia.base.org?project=walletlink',
        '10143': 'https://testnet-rpc.monad.xyz?project=walletlink'
      })
    })
  })
})
