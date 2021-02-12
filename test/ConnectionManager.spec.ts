import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { getConfiguration } from '../src/configuration'
import { ConnectionManager, connection } from '../src/ConnectionManager'
import {
  FortmaticConnector,
  InjectedConnector,
  WalletConnectConnector
} from '../src/connectors'
import { LocalStorage } from '../src/storage'
import { ChainId, ClosableConnector, ProviderType } from '../src/types'
import { StubClosableConnector, StubConnector, StubStorage } from './utils'

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
    storage.clear()
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
        ChainId.ROPSTEN
      )
      const activateResult = await stubConnector.activate()

      expect(JSON.stringify(result)).to.eq(
        JSON.stringify({
          provider: {
            request: () => {},
            send: () => {}
          },
          account: activateResult.account,
          chainId: ChainId.ROPSTEN
        })
      )
    })

    it('should not patch the provider with the request method if it already exists', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ROPSTEN
      )
      const { account } = await stubConnector.activate()

      expect(JSON.stringify(result)).to.eq(
        JSON.stringify({
          provider: {
            request: () => {}
          },
          account,
          chainId: ChainId.ROPSTEN
        })
      )
    })

    it('should store the last provider and chain', async () => {
      const stubConnector = new StubConnector()
      const configuration = getConfiguration()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(ProviderType.INJECTED, ChainId.KOVAN)

      const value = JSON.stringify({
        providerType: ProviderType.INJECTED,
        chainId: ChainId.KOVAN
      })
      expect(storage.get(configuration.storageKey)).to.eq(value)
    })
  })

  describe('#tryPreviousConnection', () => {
    it('should throw if called without provider type and none is found on storage', () => {
      expect(connectionManager.tryPreviousConnection()).to.eventually.throw(
        new Error(
          'Could not find a valid provider. Make sure to call the `connect` method first'
        )
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
          account,
          chainId: ChainId.MAINNET
        })
      )
    })
  })

  describe('#getConnectionData', () => {
    it('should return the data used on the last successful connection', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(ProviderType.INJECTED, ChainId.KOVAN)

      expect(connectionManager.getConnectionData()).to.deep.eq({
        providerType: ProviderType.INJECTED,
        chainId: ChainId.KOVAN
      })
    })

    it('should return undefined if no connection happneed', () => {
      expect(connectionManager.getConnectionData()).to.eq(undefined)
    })
  })

  describe('#disconnect', () => {
    it('should not do anything if no connector exists', () => {
      expect(connectionManager.disconnect()).not.to.eventually.throw()
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
        expect(createdProvider).to.eq(provider)
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
      expect(connectionManager.getProvider()).to.eventually.throw(
        new Error('No valid connector found. Please .connect() first')
      )
    })
  })

  describe('#getAvailableProviders', () => {
    it('should return an array with the provider types', () => {
      expect(connectionManager.getAvailableProviders()).to.deep.eq([
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT
      ])
    })

    it('should add the INJECTED provider if window.ethereum exists', () => {
      const browser: any = global
      browser.window = { ethereum: true }

      expect(connectionManager.getAvailableProviders()).to.deep.eq([
        ProviderType.INJECTED,
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT
      ])

      browser.window = undefined
    })
  })

  describe('#buildConnector', () => {
    it('should throw if an invalid provider type is supplied', () => {
      const providerType = 'Invalid Provider Type' as any
      expect(() =>
        connectionManager.buildConnector(providerType, ChainId.MAINNET)
      ).to.throw(`Invalid provider ${providerType}`)
    })

    it('should return an instance of FortmaticConnector for the supplied chain', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.FORTMATIC,
        ChainId.KOVAN
      )
      expect(connector).to.be.instanceOf(FortmaticConnector)
      expect(connector.getChainId()).to.eventually.eq(ChainId.KOVAN)
    })

    it('should return an instance of InjectedConnector for the supplied chain', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.INJECTED,
        ChainId.KOVAN
      )
      expect(connector).to.be.instanceOf(InjectedConnector)
      expect(connector.getChainId()).to.eventually.eq(ChainId.KOVAN)
    })

    it('should return an instance of WalletConnectConnector for the supplied chain', () => {
      const connector = connectionManager.buildConnector(
        ProviderType.WALLET_CONNECT,
        ChainId.KOVAN
      )
      expect(connector).to.be.instanceOf(WalletConnectConnector)
      expect(connector.getChainId()).to.eventually.eq(ChainId.KOVAN)
    })
  })
})
