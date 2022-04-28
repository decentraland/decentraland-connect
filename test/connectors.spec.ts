import { expect } from 'chai'
import sinon from 'sinon'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import {
  InjectedConnector,
  FortmaticConnector,
  NetworkConnector,
  WalletConnectConnector,
  WalletLinkConnector
} from '../src/connectors'
import * as configurationMethods from '../src/configuration'
import { getSendableProvider } from './utils'

describe('connectors', () => {
  const configuration = configurationMethods.getConfiguration()

  describe('InjectedConnector', () => {
    const browser: any = global

    after(() => {
      delete browser.window
    })

    describe('#constructor', () => {
      it('should call super with the supplied chain id as supported chain ids', () => {
        const chainId = ChainId.ETHEREUM_RINKEBY
        const connector = new InjectedConnector(chainId)
        browser.window = { ethereum: getSendableProvider(chainId) }

        expect(connector.supportedChainIds).to.deep.eq([chainId])
        return expect(connector.getChainId()).to.eventually.eq(chainId)
      })
    })
  })

  describe('FortmaticConnector', () => {
    describe('#constructor', () => {
      it('should call super with the Fortmatic configuration for the supplied chain id', async () => {
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

        expect(await connector.getChainId()).to.eq(chainId)
        expect(await connector.getApiKey()).to.eq(apiKey)

        configurationStub.restore()
      })
    })
  })

  describe('NetworkConnector', () => {
    describe('#constructor', () => {
      it('should call super with the supplied chain id as default chain id', () => {
        const chainId = ChainId.ETHEREUM_RINKEBY
        const connector = new NetworkConnector(chainId)

        return expect(connector.getChainId()).to.eventually.eq(chainId)
      })
    })
  })

  describe('WalletConnectConnector', () => {
    describe('#constructor', () => {
      it('should call super with the correct configuration', async () => {
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

        const connector = new WalletConnectConnector()
        connector.walletConnectProvider = getSendableProvider(chainId)

        const expectedChainIds = Object.keys(
          configurationMethods.getRpcUrls(ProviderType.WALLET_CONNECT)
        ).map(key => Number(key))

        expect(connector.getQrCode()).to.eq(true)
        expect(connector.getPollingInterval()).to.eq(150000)
        expect(connector.supportedChainIds).to.deep.eq(expectedChainIds)

        configurationStub.restore()
      })
    })
  })

  describe('WalletLinkConnector', () => {
    describe('#constructor', () => {
      it('should call super with the correct configuration', async () => {
        const chainId = ChainId.ETHEREUM_RINKEBY
        const connector = new WalletLinkConnector(chainId)

        expect(connector.supportedChainIds).to.deep.eq([chainId])
      })
    })
  })
})
