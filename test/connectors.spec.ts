import { expect } from 'chai'
import sinon from 'sinon'
import {
  InjectedConnector,
  FortmaticConnector,
  NetworkConnector,
  WalletConnectConnector
} from '../src/connectors'
import * as configurationMethods from '../src/configuration'
import { ChainId, ProviderType } from '../src/types'

describe('connectors', () => {
  const configuration = configurationMethods.getConfiguration()

  describe('InjectedConnector', () => {
    describe('#constructor', () => {
      it('should call super with the supplied chain id as supported chain ids', () => {
        const chainId = ChainId.ETHEREUM_RINKEBY
        const connector = new InjectedConnector(chainId)

        expect(connector.getChainId()).to.eventually.eq(chainId)
        expect(connector.supportedChainIds).to.deep.eq([chainId])
      })
    })
  })

  describe('FortmaticConnector', () => {
    describe('#constructor', () => {
      it('should call super with the Fortmatic configuration for the supplied chain id', () => {
        const chainId = ChainId.ETHEREUM_ROPSTEN
        const apiKey = 'test-api-key'

        const mockConfiguration = {
          ...configuration,
          [ProviderType.FORTMATIC]: {
            ...configuration[ProviderType.FORTMATIC],
            apiKeys: {
              ...configuration[ProviderType.FORTMATIC].apiKeys,
              [chainId]: apiKey
            }
          }
        }
        const configurationStub = sinon
          .stub(configurationMethods, 'getConfiguration')
          .returns(mockConfiguration)

        const connector = new FortmaticConnector(chainId)

        expect(connector.getChainId()).to.eventually.eq(chainId)
        expect(connector.getApiKey()).to.eventually.eq(apiKey)

        configurationStub.restore()
      })
    })
  })

  describe('NetworkConnector', () => {
    describe('#constructor', () => {
      it('should call super with the supplied chain id as default chain id', () => {
        const chainId = ChainId.ETHEREUM_RINKEBY
        const connector = new NetworkConnector(chainId)

        expect(connector.getChainId()).to.eventually.eq(chainId)
      })
    })

    describe('#getURLs', () => {
      it('should return the available RPC urls', () => {
        const connector = new NetworkConnector(ChainId.ETHEREUM_MAINNET)
        const urls = connector.getURLs()
        // We only care about keys here, the values can change
        expect(Object.keys(urls).map(Number)).to.deep.eq([
          ChainId.ETHEREUM_MAINNET,
          ChainId.ETHEREUM_ROPSTEN,
          ChainId.ETHEREUM_RINKEBY,
          ChainId.ETHEREUM_GOERLI,
          ChainId.ETHEREUM_KOVAN,
          ChainId.MATIC_MAINNET,
          ChainId.MATIC_MUMBAI
        ])
      })
    })
  })

  describe('WalletConnectConnector', () => {
    describe('#constructor', () => {
      it('should call super with the configuration and supplied chain id', () => {
        const chainId = ChainId.ETHEREUM_KOVAN
        const url = 'some-weird-url'

        const mockConfiguration = {
          ...configuration,
          [ProviderType.WALLET_CONNECT]: {
            ...configuration[ProviderType.WALLET_CONNECT],
            urls: {
              ...configuration[ProviderType.WALLET_CONNECT].urls,
              [chainId]: url
            }
          }
        }
        const configurationStub = sinon
          .stub(configurationMethods, 'getConfiguration')
          .returns(mockConfiguration)

        const connector = new WalletConnectConnector(chainId)

        expect(connector.getChainId()).to.eventually.eq(chainId)
        expect(connector.getRpc()).to.eventually.eq(url)
        expect(connector.getQrCode()).to.eq(true)
        expect(connector.getPollingInterval()).to.eq(15000)

        configurationStub.restore()
      })
    })
  })
})
