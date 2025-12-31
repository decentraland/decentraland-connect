import sinon from 'sinon'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { getConfiguration } from '../src/configuration'
import { ConnectionManager, connection } from '../src/ConnectionManager'
import {
  FortmaticConnector,
  InjectedConnector,
  WalletLinkConnector
} from '../src/connectors'
import { LocalStorage } from '../src/storage'
import { ClosableConnector, ErrorUnlockingWallet } from '../src/types'
import {
  StubClosableConnector,
  StubConnector,
  StubLockedWalletConnector,
  StubStorage,
  getSendableProvider
} from './utils'

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
      expect(connection.storage).toBeInstanceOf(LocalStorage)
    })
  })

  describe('#connect', () => {
    it('should set the connector', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      expect(connectionManager.connector).toBe(undefined)
      await connectionManager.connect(ProviderType.INJECTED)
      expect(connectionManager.connector).toBe(stubConnector)
    })

    it('should activate the connector', async () => {
      const stubConnector = new StubConnector()
      const getConnectorStub = sinon
        .stub(connectionManager, 'buildConnector')
        .returns(stubConnector)
      const activateStub = sinon.stub(stubConnector, 'activate').callThrough()

      await connectionManager.connect(ProviderType.INJECTED)

      expect(getConnectorStub.calledWith(ProviderType.INJECTED)).toBe(true)
      expect(activateStub.calledOnce).toBe(true)
    })

    it('should return the connection data', async () => {
      const stubConnector = new StubConnector()
      stubConnector.setChainId(ChainId.ETHEREUM_SEPOLIA)
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_SEPOLIA
      )
      const activateResult = await stubConnector.activate()

      expect(JSON.stringify(result)).toBe(
        JSON.stringify({
          provider: {
            request: () => {},
            send: () => {}
          },
          providerType: ProviderType.INJECTED,
          account: activateResult.account,
          chainId: ChainId.ETHEREUM_SEPOLIA
        })
      )
    })

    it('should not patch the provider with the request method if it already exists', async () => {
      const stubConnector = new StubConnector()
      stubConnector.setChainId(ChainId.ETHEREUM_SEPOLIA)
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_SEPOLIA
      )
      const { account } = await stubConnector.activate()

      expect(JSON.stringify(result)).toBe(
        JSON.stringify({
          provider: {
            request: () => {}
          },
          providerType: ProviderType.INJECTED,
          account,
          chainId: ChainId.ETHEREUM_SEPOLIA
        })
      )
    })

    it('should store the last provider and chain', async () => {
      const stubConnector = new StubConnector()
      stubConnector.setChainId(ChainId.ETHEREUM_SEPOLIA)
      const configuration = getConfiguration()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(
        ProviderType.NETWORK,
        ChainId.ETHEREUM_SEPOLIA
      )

      const value = JSON.stringify({
        providerType: ProviderType.NETWORK,
        chainId: ChainId.ETHEREUM_SEPOLIA
      })

      expect(storage.get(configuration.storageKey)).toBe(value)
    })

    it('should store and return the current chain id and not the one supplied', async () => {
      const stubConnector = new StubConnector()
      stubConnector.setChainId(ChainId.ETHEREUM_MAINNET)
      const configuration = getConfiguration()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      const result = await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_SEPOLIA
      )
      const activateResult = await stubConnector.activate()
      const value = JSON.stringify({
        providerType: ProviderType.INJECTED,
        chainId: ChainId.ETHEREUM_MAINNET
      })

      expect(JSON.stringify(result)).toBe(
        JSON.stringify({
          provider: {
            request: () => {},
            send: () => {}
          },
          providerType: ProviderType.INJECTED,
          account: activateResult.account,
          chainId: ChainId.ETHEREUM_MAINNET
        })
      )
      expect(storage.get(configuration.storageKey)).toBe(value)
    })

    describe('and the wallet is locked', () => {
      it('should throw an error when activating the connector', async () => {
        const stubConnector = new StubLockedWalletConnector()
        sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)
        await expect(
          connectionManager.connect(ProviderType.INJECTED)
        ).rejects.toThrow(ErrorUnlockingWallet)
      })
    })
  })

  describe('#tryPreviousConnection', () => {
    it('should throw if called without provider type and none is found on storage', async () => {
      await expect(
        connectionManager.tryPreviousConnection()
      ).rejects.toThrow(
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
      ).toBe(true)

      expect(JSON.stringify(result)).toBe(
        JSON.stringify({
          provider: {
            request: () => {}
          },
          providerType: ProviderType.FORTMATIC,
          chainId: ChainId.ETHEREUM_MAINNET,
          account
        })
      )
    })
  })

  describe('#getConnectionData', () => {
    it('should return the data used on the last successful connection', async () => {
      const stubConnector = new StubConnector()
      stubConnector.setChainId(ChainId.ETHEREUM_SEPOLIA)
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_SEPOLIA
      )

      expect(connectionManager.getConnectionData()).toEqual({
        providerType: ProviderType.INJECTED,
        chainId: ChainId.ETHEREUM_SEPOLIA
      })
    })

    it('should return undefined if no connection happened', () => {
      expect(connectionManager.getConnectionData()).toBe(undefined)
    })
  })

  describe('#isConnected', () => {
    it('should return true if a connector exists and a connection happened', async () => {
      const stubConnector = new StubConnector()
      sinon.stub(connectionManager, 'buildConnector').returns(stubConnector)

      await connectionManager.connect(
        ProviderType.INJECTED,
        ChainId.ETHEREUM_MAINNET
      )

      expect(connectionManager.isConnected()).toBe(true)
    })

    it("should return false if there's no previous connection data", () => {
      expect(connectionManager.isConnected()).toBe(false)
    })

    it("should return false if there's no connector defined", async () => {
      connectionManager.connector = new StubConnector()
      await connectionManager.disconnect()
      expect(connectionManager.isConnected()).toBe(false)
    })
  })

  describe('#disconnect', () => {
    it('should not do anything if no connector exists', async () => {
      await expect(connectionManager.disconnect()).resolves.not.toThrow()
    })

    it('should deactivate the connector', async () => {
      connectionManager.connector = new StubConnector()
      const deactivateStub = sinon.stub(
        connectionManager.connector,
        'deactivate'
      )

      await connectionManager.disconnect()

      expect(deactivateStub.calledOnce).toBe(true)
    })

    it('should call close if the provider type allows it', async () => {
      connectionManager.connector = new StubClosableConnector()
      const closeStub = sinon.stub(
        connectionManager.connector as ClosableConnector,
        'close'
      )

      await connectionManager.disconnect()

      expect(closeStub.calledOnce).toBe(true)
      sinon.restore()
    })

    it('should clean the storage', async () => {
      const configuration = getConfiguration()
      storage.set(configuration.storageKey, 'data')

      connectionManager.connector = new StubConnector()
      await connectionManager.disconnect()

      expect(storage.get(configuration.storageKey)).toBe(undefined)
    })

    it('should clean the instance variables', async () => {
      connectionManager.connector = new StubConnector()

      await connectionManager.disconnect()

      expect(connectionManager.connector).toBe(undefined)
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

        expect(getConnectorStub.calledWith(providerType)).toBe(true)
        expect(getProviderStub.calledOnce).toBe(true)
        expect(createdProvider.request).not.toBe(undefined)
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

      expect(getProviderStub.calledOnce).toBe(true)
    })

    it('should throw if no successful connect occurred', async () => {
      connectionManager.connector = undefined
      await expect(connectionManager.getProvider()).rejects.toThrow(
        'No valid connector found. Please .connect() first'
      )
    })
  })

  describe('#getAvailableProviders', () => {
    it('should return an array with the provider types', () => {
      expect(connectionManager.getAvailableProviders()).toEqual([
        ProviderType.METAMASK_MOBILE,
        ProviderType.FORTMATIC,
        ProviderType.WALLET_CONNECT,
        ProviderType.WALLET_LINK
      ])
    })

    it('should add the INJECTED provider if window.ethereum exists', () => {
      const browser: any = global
      browser.window = { ethereum: true }

      expect(connectionManager.getAvailableProviders()).toEqual([
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
    const chainId = ChainId.ETHEREUM_SEPOLIA

    afterAll(() => {
      delete browser.window
    })

    it('should throw if an invalid provider type is supplied', () => {
      const providerType = 'Invalid Provider Type' as any
      expect(() =>
        connectionManager.buildConnector(providerType, ChainId.ETHEREUM_MAINNET)
      ).toThrow(`Invalid provider ${providerType}`)
    })

    it('should return an instance of FortmaticConnector for the supplied chain', async () => {
      const connector = connectionManager.buildConnector(
        ProviderType.FORTMATIC,
        chainId
      )
      expect(connector).toBeInstanceOf(FortmaticConnector)
      await expect(connector.getChainId()).resolves.toBe(chainId)
    })

    it('should return an instance of InjectedConnector for the supplied chain', async () => {
      const connector = connectionManager.buildConnector(
        ProviderType.INJECTED,
        chainId
      )
      browser.window = { ethereum: getSendableProvider(chainId) }

      expect(connector).toBeInstanceOf(InjectedConnector)
      await expect(connector.getChainId()).resolves.toBe(chainId)
    })

    it('should return an instance of WalletLinkConnector', async () => {
      const connector = connectionManager.buildConnector(
        ProviderType.WALLET_LINK,
        chainId
      )
      expect(connector).toBeInstanceOf(WalletLinkConnector)
      expect(connector.supportedChainIds).toEqual([chainId])
    })
  })
})
