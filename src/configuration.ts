import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'

const configuration = Object.freeze({
  storageKey: 'decentraland-connect-storage-key',

  [ProviderType.INJECTED]: {},

  [ProviderType.FORTMATIC]: {
    apiKeys: {
      [ChainId.ETHEREUM_MAINNET]: 'pk_live_F8E24DF8DD5BCBC5',
      [ChainId.ETHEREUM_ROPSTEN]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_RINKEBY]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_KOVAN]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_GOERLI]: 'pk_test_5B728BEFE5C10911',
      [ChainId.ETHEREUM_SEPOLIA]: 'pk_test_5B728BEFE5C10911'
    },
    urls: getRpcUrls(ProviderType.FORTMATIC)
  },

  [ProviderType.NETWORK]: {
    urls: getRpcUrls(ProviderType.NETWORK)
  },

  [ProviderType.WALLET_CONNECT]: {
    urls: getRpcUrls(ProviderType.WALLET_CONNECT)
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
        optionalChains: [ChainId.MATIC_MAINNET]
      },
      [ChainId.ETHEREUM_GOERLI]: {
        chains: [ChainId.ETHEREUM_GOERLI],
        optionalChains: [ChainId.MATIC_MUMBAI]
      },
      [ChainId.ETHEREUM_SEPOLIA]: {
        chains: [ChainId.ETHEREUM_SEPOLIA],
        optionalChains: [ChainId.MATIC_MUMBAI]
      }
    }
  }
})

export function getConfiguration() {
  return configuration
}

export function getRpcUrls(providerType: ProviderType) {
  const rpcUrls = {
    [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet',
    [ChainId.ETHEREUM_SEPOLIA]: 'https://rpc.decentraland.org/sepolia',
    [ChainId.ETHEREUM_ROPSTEN]: 'https://rpc.decentraland.org/ropsten',
    [ChainId.ETHEREUM_RINKEBY]: 'https://rpc.decentraland.org/rinkeby',
    [ChainId.ETHEREUM_GOERLI]: 'https://rpc.decentraland.org/goerli',
    [ChainId.ETHEREUM_KOVAN]: 'https://rpc.decentraland.org/kovan',
    [ChainId.MATIC_MAINNET]: 'https://rpc.decentraland.org/polygon',
    [ChainId.MATIC_MUMBAI]: 'https://rpc.decentraland.org/mumbai'
  }

  let project = ''

  switch (providerType) {
    case ProviderType.WALLET_CONNECT:
      project = 'walletconnect'
      break
    case ProviderType.WALLET_LINK:
      project = 'walletlink'
      break
    case ProviderType.FORTMATIC:
      project = 'fortmatic'
      break
    case ProviderType.WALLET_CONNECT_V2:
      project = 'walletconnect-v2'
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
