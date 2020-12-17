import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { ConnectionManager, connection } from '../src/ConnectionManager'
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
    storage.clean()
  })

  describe('connection', () => {
    it('should use LocalStorage as its storage', () => {
      expect(connection.storage).to.instanceOf(LocalStorage)
    })
  })

  describe('#connect', () => {
    it('should set the provider type', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'getConnector').returns(stubConnector)

      expect(connectionManager.providerType).to.eq(undefined)
      await connectionManager.connect(ProviderType.INJECTED)
      expect(connectionManager.providerType).to.eq(ProviderType.INJECTED)
    })

    it('should set the connector', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'getConnector').returns(stubConnector)

      expect(connectionManager.connector).to.eq(undefined)
      await connectionManager.connect(ProviderType.INJECTED)
      expect(connectionManager.connector).to.eq(stubConnector)
    })

    it('should activate the connector', async () => {
      const stubConnector = new StubConnector()
      const getConnectorStub = sinon
        .stub(connectionManager, 'getConnector')
        .returns(stubConnector)
      const activateStub = sinon.stub(stubConnector, 'activate').callThrough()

      await connectionManager.connect(ProviderType.INJECTED)

      expect(getConnectorStub.calledWith(ProviderType.INJECTED)).to.eq(true)
      expect(activateStub.calledOnce).to.eq(true)
    })

    it('should return the connection data', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'getConnector').returns(stubConnector)

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
      sinon.stub(connectionManager, 'getConnector').returns(stubConnector)

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

    it('should throw if called wihtout provider type and none is found on storage', () => {
      expect(connectionManager.connect()).to.eventually.throw(
        new Error('connect called without a provider and none was stored')
      )
    })

    it('should store the last provider and chain', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'getConnector').returns(stubConnector)

      await connectionManager.connect(ProviderType.INJECTED)

      expect(storage.get()).to.eq(ProviderType.INJECTED)
    })

    it('should connect to the last supplied provider', async () => {
      const stubConnector = new StubConnector()
      const getConnectorStub = sinon
        .stub(connectionManager, 'getConnector')
        .returns(stubConnector)

      await connectionManager.connect(ProviderType.FORTMATIC)
      const result = await connectionManager.connect()
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
      await deactivate(ProviderType.FORTMATIC, true)
      await deactivate(ProviderType.WALLET_CONNECT, true)
      await deactivate(ProviderType.INJECTED, false)

      async function deactivate(providerType: ProviderType, result: boolean) {
        connectionManager.providerType = providerType
        connectionManager.connector = new StubClosableConnector()
        const closeStub = sinon.stub(
          connectionManager.connector as ClosableConnector,
          'close'
        )

        await connectionManager.disconnect()

        expect(closeStub.calledOnce).to.eq(result)
        sinon.restore()
      }
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
          .stub(connectionManager, 'getConnector')
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
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT,
        ProviderType.INJECTED
      ])

      browser.window = undefined
    })
  })
})
