import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { WalletConnectV2Connector } from '../src/connectors/WalletConnectV2Connector'

// The connector reaches AppKit through dynamic import(); ts-jest (module: commonjs) compiles those
// to require(), so these factory mocks intercept them. We drive a controllable fake AppKit to
// exercise the connector's real activate/session-restore/stale-retry/close logic end to end.
const mockCreateAppKit = jest.fn()
const mockWagmiAdapter = jest.fn()
const mockHttp = jest.fn((url: string) => ({ __http: url }))

jest.mock('@reown/appkit', () => ({ createAppKit: (...args: unknown[]) => mockCreateAppKit(...args) }))
jest.mock('@reown/appkit-adapter-wagmi', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WagmiAdapter: function WagmiAdapter(this: unknown, config: unknown) {
    return mockWagmiAdapter(config)
  }
}))
jest.mock('@reown/appkit/networks', () => ({
  mainnet: { id: 1 },
  sepolia: { id: 11155111 },
  polygon: { id: 137 },
  polygonAmoy: { id: 80002 },
  arbitrum: { id: 42161 },
  optimism: { id: 10 },
  avalanche: { id: 43114 },
  bsc: { id: 56 },
  fantom: { id: 250 }
}))
jest.mock('viem', () => ({ http: (...args: [string]) => mockHttp(...args) }))

type FakeAccount = { status: string; address?: string; isConnected?: boolean }

type FakeAppKit = ReturnType<typeof createFakeAppKit>

function createFakeAppKit(options: { account: FakeAccount; connectAddress?: string; requestImpl?: () => Promise<unknown> }) {
  const accountSubs: Array<(account: FakeAccount) => void> = []
  let account = options.account
  const walletProvider = { request: jest.fn(options.requestImpl ?? (() => Promise.resolve('0x1'))) }

  return {
    getAccount: () => account,
    subscribeAccount: (cb: (account: FakeAccount) => void) => {
      accountSubs.push(cb)
      return () => {
        const index = accountSubs.indexOf(cb)
        if (index >= 0) accountSubs.splice(index, 1)
      }
    },
    subscribeCaipNetworkChange: () => () => undefined,
    subscribeState: () => () => undefined,
    getWalletProvider: () => walletProvider,
    getAddress: () => account.address ?? null,
    getChainId: () => 1,
    getWalletInfo: () => ({ name: 'Test Wallet' }),
    // Simulate the user connecting shortly after the modal opens: flip the account to connected and
    // notify subscribers on a later macrotask (after the connector subscribes in waitForConnection).
    open: jest.fn(async () => {
      setTimeout(() => {
        account = { status: 'connected', address: options.connectAddress ?? '0xabc', isConnected: true }
        accountSubs.forEach(cb => cb(account))
      }, 0)
    }),
    disconnect: jest.fn(() => Promise.resolve()),
    walletProvider
  }
}

describe('WalletConnectV2Connector', () => {
  let store: Record<string, string>

  beforeEach(() => {
    // Reset the module-level shared AppKit singleton between tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(WalletConnectV2Connector as any).sharedAppKit = null

    // Minimal in-memory localStorage so the real clearStorage() (which uses LocalStorage) works in
    // the node test environment.
    store = {}
    const fakeLocalStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).localStorage = fakeLocalStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).window = { localStorage: fakeLocalStorage, location: { origin: 'https://test.decentraland.org' } }

    mockCreateAppKit.mockReset()
    mockWagmiAdapter.mockReset()
    mockHttp.mockClear()
  })

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).localStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window
  })

  describe('when activating with no existing session', () => {
    let fakeAppKit: FakeAppKit

    beforeEach(() => {
      fakeAppKit = createFakeAppKit({ account: { status: 'disconnected' }, connectAddress: '0xabc' })
      mockCreateAppKit.mockReturnValue(fakeAppKit)
    })

    it('should open the connect modal and resolve once the wallet connects', async () => {
      const connector = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)

      const result = await connector.activate()

      expect(fakeAppKit.open).toHaveBeenCalledWith({ view: 'Connect' })
      expect(result.account).toBe('0xabc')
      expect(result.provider).toBe(fakeAppKit.walletProvider)
    })

    it('should wire the configured Decentraland RPC endpoints into the WagmiAdapter transports', async () => {
      const connector = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)

      await connector.activate()

      expect(mockHttp).toHaveBeenCalledWith('https://rpc.decentraland.org/mainnet?project=walletconnect-v2')
      const adapterConfig = mockWagmiAdapter.mock.calls[0][0] as { transports: Record<number, unknown> }
      expect(adapterConfig.transports[ChainId.ETHEREUM_MAINNET]).toEqual({ __http: 'https://rpc.decentraland.org/mainnet?project=walletconnect-v2' })
    })
  })

  describe('when activating with a restored session that is still alive', () => {
    let fakeAppKit: FakeAppKit

    beforeEach(() => {
      fakeAppKit = createFakeAppKit({ account: { status: 'connected', address: '0xabc', isConnected: true } })
      mockCreateAppKit.mockReturnValue(fakeAppKit)
    })

    it('should NOT open the connect modal', async () => {
      const connector = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)

      const result = await connector.activate()

      expect(fakeAppKit.open).not.toHaveBeenCalled()
      expect(result.account).toBe('0xabc')
    })
  })

  describe('when activating with a restored session that is stale on the relay', () => {
    let staleAppKit: FakeAppKit
    let freshAppKit: FakeAppKit

    beforeEach(() => {
      // First AppKit reports connected but its RPC probe fails as a stale session.
      staleAppKit = createFakeAppKit({
        account: { status: 'connected', address: '0xabc', isConnected: true },
        requestImpl: () => Promise.reject(new Error("session topic doesn't exist"))
      })
      // After clearStorage + re-init, the second AppKit is fresh and connects via the modal.
      freshAppKit = createFakeAppKit({ account: { status: 'disconnected' }, connectAddress: '0xdef' })
      mockCreateAppKit.mockReturnValueOnce(staleAppKit).mockReturnValueOnce(freshAppKit)
    })

    it('should clear storage, rebuild AppKit and open the modal to reconnect', async () => {
      const connector = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)

      const result = await connector.activate()

      expect(mockCreateAppKit).toHaveBeenCalledTimes(2)
      expect(staleAppKit.open).not.toHaveBeenCalled()
      expect(freshAppKit.open).toHaveBeenCalledWith({ view: 'Connect' })
      expect(result.account).toBe('0xdef')
    })
  })

  describe('when a second connector activates after the first', () => {
    beforeEach(() => {
      mockCreateAppKit.mockImplementation(() =>
        createFakeAppKit({ account: { status: 'disconnected' }, connectAddress: '0xabc' })
      )
    })

    it('should reuse the shared AppKit instead of creating a second one', async () => {
      const first = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)
      await first.activate()

      const second = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)
      await second.activate()

      expect(mockCreateAppKit).toHaveBeenCalledTimes(1)
    })
  })

  describe('when closing an active connector', () => {
    let fakeAppKit: FakeAppKit

    beforeEach(() => {
      fakeAppKit = createFakeAppKit({ account: { status: 'disconnected' }, connectAddress: '0xabc' })
      mockCreateAppKit.mockReturnValue(fakeAppKit)
    })

    it('should disconnect the AppKit and drop the shared singleton', async () => {
      const connector = new WalletConnectV2Connector(ChainId.ETHEREUM_MAINNET)
      await connector.activate()

      await connector.close()

      expect(fakeAppKit.disconnect).toHaveBeenCalledTimes(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((WalletConnectV2Connector as any).sharedAppKit).toBeNull()
    })
  })
})
