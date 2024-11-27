import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'

const configuration = Object.freeze({
  storageKey: 'decentraland-connect-storage-key',

  [ProviderType.INJECTED]: {},

  [ProviderType.FORTMATIC]: {
    apiKeys: {
      [ChainId.ETHEREUM_MAINNET]: 'pk_live_F8E24DF8DD5BCBC5',
      [ChainId.ETHEREUM_SEPOLIA]: 'pk_test_5B728BEFE5C10911'
    },
    urls: getRpcUrls(ProviderType.FORTMATIC)
  },

  [ProviderType.NETWORK]: {
    urls: getRpcUrls(ProviderType.NETWORK)
  },

  [ProviderType.WALLET_LINK]: {
    appName: 'Decentraland',
    urls: getRpcUrls(ProviderType.WALLET_LINK)
  },

  [ProviderType.WALLET_CONNECT_V2]: {
    projectId: '61570c542c2d66c659492e5b24a41522',
    urls: getRpcUrls(ProviderType.WALLET_CONNECT_V2),
    chains: {
      [ChainId.ETHEREUM_MAINNET]: {
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
      [ChainId.ETHEREUM_SEPOLIA]: {
        chains: [ChainId.ETHEREUM_SEPOLIA],
        optionalChains: [ChainId.MATIC_AMOY]
      }
    }
  },
  [ProviderType.MAGIC]: {
    apiKey: 'pk_live_212568025B158355',
    urls: getRpcUrls(ProviderType.MAGIC),
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
  [ProviderType.MAGIC_TEST]: {
    apiKey: 'pk_live_CE856A4938B36648',
    urls: getRpcUrls(ProviderType.MAGIC),
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

export function getConfiguration() {
  return configuration
}

export function getRpcUrls(providerType: ProviderType) {
  const rpcUrls = {
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

  let project = ''

  switch (providerType) {
    case ProviderType.WALLET_LINK:
      project = 'walletlink'
      break
    case ProviderType.FORTMATIC:
      project = 'fortmatic'
      break
    case ProviderType.MAGIC:
      project = 'magic'
      break
    case ProviderType.MAGIC_TEST:
      project = 'magic'
      break
    case ProviderType.WALLET_CONNECT_V2:
      project = 'walletconnect-v2'
      break
    case ProviderType.AUTH_SERVER:
      project = 'auth-server'
      break
    default:
      break
  }

  if (project) {
    for (const chainId in rpcUrls) {
      rpcUrls[chainId] += `?project=${project}`
    }
  }

  return rpcUrls
}
