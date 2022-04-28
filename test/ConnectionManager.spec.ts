import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { getConfiguration, getRpcUrls } from '../src/configuration'
import { ConnectionManager, connection } from '../src/ConnectionManager'
import {
  FortmaticConnector,
  InjectedConnector,
  WalletConnectConnector,
  WalletLinkConnector
} from '../src/connectors'
import { LocalStorage } from '../src/storage'
import { ClosableConnector } from '../src/types'
import {
  StubClosableConnector,
  StubConnector,
  StubStorage,
  getSendableProvider
} from './utils'

chai.use(chaiAsPromised)
const { expect } = chai

describe('ConnectionManager', () => {
  let storage: StubStorage
  let connectionManager: ConnectionManager

  beforeEach(() => {
    storage = new StubStorage()
    connectionManager = new ConnectionManager(storage)
  })

  afterEach(() => {
    sinon.restore()
    const { storageKey } = getConfiguration()
    storage.remove(storageKey)
  })

  describe('connection', () => {
    it('should use LocalStorage as its storage', () => {
      expect(connection.storage).to.instanceOf(LocalStorage)
    })
  })

  describe('#connect', () => {
    it('should set the connector', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      expect(connectionManager.connector).to.eq(undefined)
      await connectionManager.connect(ProviderType.INJECTED)
      expect(connectionManager.connector).to.eq(stubConnector)
    })

    it('should activate the connector', async () => {
      const stubConnector = new StubConnector()
      const getConnectorStub = sinon
        .stub(connectionManager, 'buildConnector')
        .returns(stubConnector)
      const activateStub = sinon.stub(stubConnector, 'activate').callThrough()

      await connectionManager.connect(ProviderType.INJECTED)

      expect(getConnectorStub.calledWith(ProviderType.INJECTED)).to.eq(true)
      expect(activateStub.calledOnce).to.eq(true)
    })

    it('should return the connection data', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_ROPSTEN
      )
      const activateResult = await stubConnector.activate()

      expect(JSON.stringify(result)).to.eq(
        JSON.stringify({
          provider: {
            request: () => {},
            send: () => {}
          },
          providerType: ProviderType.INJECTED,
          account: activateResult.account,
          chainId: ChainId.ETHEREUM_ROPSTEN
        })
      )
    })

    it('should not patch the provider with the request method if it already exists', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_ROPSTEN
      )
      const { account } = await stubConnector.activate()

      expect(JSON.stringify(result)).to.eq(
        JSON.stringify({
          provider: {
            request: () => {}
          },
          providerType: ProviderType.INJECTED,
          account,
          chainId: ChainId.ETHEREUM_ROPSTEN
        })
      )
    })

    it('should store the last provider and chain', async () => {
      const stubConnector = new StubConnector()
      const configuration = getConfiguration()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(
        ProviderType.NETWORK,
        ChainId.ETHEREUM_KOVAN
      )

      const value = JSON.stringify({
        providerType: ProviderType.NETWORK,
        chainId: ChainId.ETHEREUM_KOVAN
      })
      expect(storage.get(configuration.storageKey)).to.eq(value)
    })
  })

  describe('#tryPreviousConnection', () => {
    it('should throw if called without provider type and none is found on storage', () => {
      return expect(
        connectionManager.tryPreviousConnection()
      ).to.be.rejectedWith(
        'Could not find a valid provider. Make sure to call the `connect` method first'
      )
    })

    it('should connect to the last supplied provider', async () => {
      const stubConnector = new StubConnector()
      const getConnectorStub = sinon
        .stub(connectionManager, 'buildConnector')
        .returns(stubConnector)

      await connectionManager.connect(ProviderType.FORTMATIC)
      const result = await connectionManager.tryPreviousConnection()
      const { account } = await stubConnector.activate()

      expect(
        getConnectorStub.firstCall.calledWith(ProviderType.FORTMATIC)
      ).to.eq(true)
      expect(
        getConnectorStub.secondCall.calledWith(ProviderType.FORTMATIC)
      ).to.eq(true)

      expect(JSON.stringify(result)).to.eq(
        JSON.stringify({
          provider: {
            request: () => {}
          },
          providerType: ProviderType.FORTMATIC,
          account,
          chainId: ChainId.ETHEREUM_MAINNET
        })
      )
    })
  })

  describe('#getConnectionData', () => {
    it('should return the data used on the last successful connection', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_KOVAN
      )

      expect(connectionManager.getConnectionData()).to.deep.eq({
        providerType: ProviderType.INJECTED,
        chainId: ChainId.ETHEREUM_KOVAN
      })
    })

    it('should return undefined if no connection happneed', () => {
      expect(connectionManager.getConnectionData()).to.eq(undefined)
    })
  })

  describe('#disconnect', () => {
    it('should not do anything if no connector exists', () => {
      return expect(connectionManager.disconnect()).not.to.be.rejected
    })

    it('should deactivate the connector', async () => {
      connectionManager.connector = new StubConnector()
      const deactivateStub = sinon.stub(
        connectionManager.connector,
        'deactivate'
      )

      await connectionManager.disconnect()

      expect(deactivateStub.calledOnce).to.eq(true)
    })

    it('should call close if the provider type allows it', async () => {
      connectionManager.connector = new StubClosableConnector()
      const closeStub = sinon.stub(
        connectionManager.connector as ClosableConnector,
        'close'
      )

      await connectionManager.disconnect()

      expect(closeStub.calledOnce).to.eq(true)
      sinon.restore()
    })

    it('should clean the storage', async () => {
      const configuration = getConfiguration()
      storage.set(configuration.storageKey, 'data')

      connectionManager.connector = new StubConnector()
      await connectionManager.disconnect()

      expect(storage.get(configuration.storageKey)).to.eq(undefined)
    })

    it('should clean the instance variables', async () => {
      connectionManager.connector = new StubConnector()

      await connectionManager.disconnect()

      expect(connectionManager.connector).to.eq(undefined)
    })
  })

  describe('#createProvider', () => {
    it('creates a new connector and returns its provider', async () => {
      await createProvider(ProviderType.FORTMATIC)
      await createProvider(ProviderType.WALLET_CONNECT)
      await createProvider(ProviderType.INJECTED)

      async function createProvider(providerType: ProviderType) {
        const stubConnector = new StubConnector()
        const provider = { send: () => {} }

        const getConnectorStub = sinon
          .stub(connectionManager, 'buildConnector')
          .returns(stubConnector)
        const getProviderStub = sinon
          .stub(stubConnector, 'getProvider')
          .returns(Promise.resolve(provider))

        const createdProvider = await connectionManager.createProvider(
          providerType
        )

        expect(getConnectorStub.calledWith(providerType)).to.eq(true)
        expect(getProviderStub.calledOnce).to.eq(true)
        expect(createdProvider.request).not.to.eq(undefined)
        sinon.restore()
      }
    })
  })

  describe('#getProvider', () => {
    it('should call the connectors getProvider method', async () => {
      connectionManager.connector = new StubConnector()
      const getProviderStub = sinon.stub(
        connectionManager.connector,
        'getProvider'
      )

      await connectionManager.getProvider()

      expect(getProviderStub.calledOnce).to.eq(true)
    })

    it('should throw if no successful connect occurred', () => {
      connectionManager.connector = undefined
      return expect(connectionManager.getProvider()).to.be.rejectedWith(
        'No valid connector found. Please .connect() first'
      )
    })
  })

  describe('#getAvailableProviders', () => {
    it('should return an array with the provider types', () => {
      expect(connectionManager.getAvailableProviders()).to.deep.eq([
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT,
        ProviderType.WALLET_LINK
      ])
    })

    it('should add the INJECTED provider if window.ethereum exists', () => {
      const browser: any = global
      browser.window = { ethereum: true }

      expect(connectionManager.getAvailableProviders()).to.deep.eq([
        ProviderType.INJECTED,
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT,
        ProviderType.WALLET_LINK
      ])

      browser.window = undefined
    })
  })

  describe('#buildConnector', () => {
    const browser: any = global
    const chainId = ChainId.ETHEREUM_KOVAN

    after(() => {
      delete browser.window
    })

    it('should throw if an invalid provider type is supplied', () => {
      const providerType = 'Invalid Provider Type' as any
      expect(() =>
        connectionManager.buildConnector(providerType, ChainId.ETHEREUM_MAINNET)
      ).to.throw(`Invalid provider ${providerType}`)
    })

    it('should return an instance of FortmaticConnector for the supplied chain', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.FORTMATIC,
        chainId
      )
      expect(connector).to.be.instanceOf(FortmaticConnector)
      return expect(connector.getChainId()).to.eventually.eq(chainId)
    })

    it('should return an instance of InjectedConnector for the supplied chain', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.INJECTED,
        chainId
      )
      browser.window = { ethereum: getSendableProvider(chainId) }

      expect(connector).to.be.instanceOf(InjectedConnector)
      return expect(connector.getChainId()).to.eventually.eq(chainId)
    })

    it('should return an instance of WalletConnectConnector supporting all chain ids', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.WALLET_CONNECT,
        chainId
      ) as WalletConnectConnector

      connector.walletConnectProvider = getSendableProvider(chainId)

      const expectedChainIds = Object.keys(
        getRpcUrls(ProviderType.WALLET_CONNECT)
      ).map(key => Number(key))

      expect(connector).to.be.instanceOf(WalletConnectConnector)
      expect(connector.supportedChainIds).to.deep.eq(expectedChainIds)
    })

    it('should return an instance of WalletLinkConnector', async () => {
      const connector = connectionManager.buildConnector(
        ProviderType.WALLET_LINK,
        chainId
      )
      expect(connector).to.be.instanceOf(WalletLinkConnector)
      expect(connector.supportedChainIds).to.deep.eq([chainId])
    })
  })
})
