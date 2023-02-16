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
      [ChainId.ETHEREUM_KOVAN]: 'pk_test_5B728BEFE5C10911'
    }
  },

  [ProviderType.NETWORK]: {
    urls: getRpcUrls(ProviderType.NETWORK)
  },

  [ProviderType.WALLET_CONNECT]: {
    urls: getRpcUrls(ProviderType.WALLET_CONNECT)
  },

  [ProviderType.WALLET_CONNECT_V2]: {
    mainnet: {
      projectId: '61570c542c2d66c659492e5b24a41522',
      chains: [ChainId.ETHEREUM_MAINNET, ChainId.MATIC_MAINNET],
      rpcMap: (() => {
        const urls = getRpcUrls(ProviderType.WALLET_CONNECT_V2)

        return {
          [ChainId.ETHEREUM_MAINNET]: urls[ChainId.ETHEREUM_MAINNET],
          [ChainId.MATIC_MAINNET]: urls[ChainId.MATIC_MAINNET]
        }
      })()
    },
    testnet: {
      projectId: '61570c542c2d66c659492e5b24a41522',
      chains: [ChainId.ETHEREUM_GOERLI, ChainId.MATIC_MUMBAI],
      rpcMap: (() => {
        const urls = getRpcUrls(ProviderType.WALLET_CONNECT_V2)

        return {
          [ChainId.ETHEREUM_GOERLI]: urls[ChainId.ETHEREUM_GOERLI],
          [ChainId.MATIC_MUMBAI]: urls[ChainId.MATIC_MUMBAI]
        }
      })()
    }
  },

  [ProviderType.WALLET_LINK]: {
    appName: 'Decentraland',
    urls: getRpcUrls(ProviderType.WALLET_LINK)
  }
})

export function getConfiguration() {
  return configuration
}

export function getWalletConnectV2ConfigFromChainId(chainId: ChainId) {
  const { mainnet, testnet } = getConfiguration()[
    ProviderType.WALLET_CONNECT_V2
  ]

  if (mainnet.chains.includes(chainId)) {
    return mainnet
  }

  if (testnet.chains.includes(chainId)) {
    return testnet
  }

  throw new Error(`Unsupported Chain: ${chainId}`)
}

export function getRpcUrls(providerType: ProviderType) {
  const rpcUrls = {
    [ChainId.ETHEREUM_MAINNET]: 'https://rpc.decentraland.org/mainnet',
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
    case ProviderType.WALLET_CONNECT_V2:
      project = 'walletconnect-v2'
      break
    case ProviderType.WALLET_LINK:
      project = 'walletlink'
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
