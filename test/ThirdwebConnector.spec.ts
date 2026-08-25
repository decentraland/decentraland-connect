import { ChainId } from '@dcl/schemas'
import { stripUnknownTxParams, ThirdwebConnector } from '../src/connectors/ThirdwebConnector'
import { Provider } from '../src/types'

// Mock thirdweb modules as virtual modules (not installed)
const mockAutoConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockGetAccount = jest.fn()
const mockInAppWallet = jest.fn()
const mockDefineChain = jest.fn()
const mockToProvider = jest.fn()
const mockCreateThirdwebClient = jest.fn()
const mockGetUserEmail = jest.fn()

jest.mock(
  'thirdweb',
  () => ({
    createThirdwebClient: (config: { clientId: string }) => mockCreateThirdwebClient(config)
  }),
  { virtual: true }
)

jest.mock(
  'thirdweb/wallets',
  () => ({
    inAppWallet: () => {
      const wallet = {
        autoConnect: mockAutoConnect,
        disconnect: mockDisconnect,
        getAccount: mockGetAccount
      }
      mockInAppWallet()
      return wallet
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    EIP1193: {
      toProvider: (options: unknown) => mockToProvider(options)
    }
  }),
  { virtual: true }
)

jest.mock(
  'thirdweb/chains',
  () => ({
    defineChain: (chainId: number) => mockDefineChain(chainId)
  }),
  { virtual: true }
)

jest.mock(
  'thirdweb/wallets/in-app',
  () => ({
    getUserEmail: (options: unknown) => mockGetUserEmail(options)
  }),
  { virtual: true }
)

describe('ThirdwebConnector', () => {
  let connector: ThirdwebConnector

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when constructing a new instance', () => {
    beforeEach(() => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
    })

    it('should set the chainId correctly', async () => {
      const chainId = await connector.getChainId()
      expect(chainId).toBe(ChainId.ETHEREUM_MAINNET)
    })

    it('should have supportedChainIds from configuration', () => {
      expect(connector.supportedChainIds).toContain(ChainId.ETHEREUM_MAINNET)
      expect(connector.supportedChainIds).toContain(ChainId.ETHEREUM_SEPOLIA)
    })
  })

  describe('when activating the connector', () => {
    let mockAccount: { address: string }
    let mockProvider: { request: jest.Mock }

    beforeEach(() => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
      mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678' }
      mockProvider = { request: jest.fn() }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    describe('and the user has an active session', () => {
      beforeEach(() => {
        mockAutoConnect.mockResolvedValueOnce(mockAccount)
        mockDefineChain.mockReturnValueOnce({ id: ChainId.ETHEREUM_MAINNET })
        mockToProvider.mockReturnValueOnce(mockProvider)
        mockCreateThirdwebClient.mockReturnValueOnce({ clientId: 'test' })
      })

      it('should return the provider and account', async () => {
        const result = await connector.activate()

        expect(result.account).toBe(mockAccount.address)
        expect(result.chainId).toBe(ChainId.ETHEREUM_MAINNET)
        expect(result.provider).toBeDefined()
      })

      it('should call autoConnect with the client', async () => {
        await connector.activate()

        expect(mockAutoConnect).toHaveBeenCalledWith(expect.objectContaining({}))
      })

      it('should create the EIP-1193 provider', async () => {
        await connector.activate()

        expect(mockToProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            chain: expect.anything(),
            client: expect.anything(),
            wallet: expect.anything()
          })
        )
      })
    })

    describe('and the user does not have an active session', () => {
      beforeEach(() => {
        mockAutoConnect.mockRejectedValueOnce(new Error('No session'))
        mockCreateThirdwebClient.mockReturnValueOnce({ clientId: 'test' })
      })

      it('should throw an error', async () => {
        await expect(connector.activate()).rejects.toThrow('Thirdweb: No active session. User must authenticate first.')
      })
    })

    describe('and autoConnect returns null', () => {
      beforeEach(() => {
        mockAutoConnect.mockResolvedValueOnce(null)
        mockCreateThirdwebClient.mockReturnValueOnce({ clientId: 'test' })
      })

      it('should throw an error', async () => {
        await expect(connector.activate()).rejects.toThrow('Thirdweb: No active session. User must authenticate first.')
      })
    })
  })

  describe('when getting the provider', () => {
    beforeEach(() => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
    })

    describe('and the connector is not activated', () => {
      it('should throw an error', async () => {
        await expect(connector.getProvider()).rejects.toThrow('Thirdweb: wallet is not connected. Call activate() first.')
      })
    })
  })

  describe('when getting the account', () => {
    beforeEach(() => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
    })

    describe('and the wallet is not initialized', () => {
      it('should return null', async () => {
        const account = await connector.getAccount()
        expect(account).toBeNull()
      })
    })
  })

  describe('when getting the email', () => {
    beforeEach(() => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
      mockCreateThirdwebClient.mockReturnValue({ clientId: 'test' })
    })

    describe('and the user has an email', () => {
      beforeEach(() => {
        mockGetUserEmail.mockResolvedValueOnce('user@example.com')
      })

      it('should return the email', async () => {
        const email = await connector.getEmail()
        expect(email).toBe('user@example.com')
      })

      it('should call getUserEmail with the client', async () => {
        await connector.getEmail()
        expect(mockGetUserEmail).toHaveBeenCalledWith(expect.objectContaining({ client: expect.anything() }))
      })
    })

    describe('and the user has no email', () => {
      beforeEach(() => {
        mockGetUserEmail.mockResolvedValueOnce(undefined)
      })

      it('should return undefined', async () => {
        const email = await connector.getEmail()
        expect(email).toBeUndefined()
      })
    })

    describe('and getUserEmail throws', () => {
      beforeEach(() => {
        mockGetUserEmail.mockRejectedValueOnce(new Error('boom'))
      })

      it('should resolve to undefined without throwing', async () => {
        await expect(connector.getEmail()).resolves.toBeUndefined()
      })
    })
  })

  describe('when closing the connector', () => {
    let mockAccount: { address: string }
    let mockProvider: { request: jest.Mock }

    beforeEach(async () => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
      mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678' }
      mockProvider = { request: jest.fn() }

      mockAutoConnect.mockResolvedValueOnce(mockAccount)
      mockDefineChain.mockReturnValueOnce({ id: ChainId.ETHEREUM_MAINNET })
      mockToProvider.mockReturnValueOnce(mockProvider)
      mockCreateThirdwebClient.mockReturnValueOnce({ clientId: 'test' })

      await connector.activate()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should call wallet.disconnect()', async () => {
      await connector.close()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('when dispatching an eth_sendTransaction through the provider', () => {
    let provider: Provider
    let thirdwebRequest: jest.Mock

    const withExtra = { method: 'eth_sendTransaction', params: [{ to: '0xdef', data: '0x', value: '0x0', extraCallData: '0xa9059cbb' }] }
    const stripped = { method: 'eth_sendTransaction', params: [{ to: '0xdef', data: '0x', value: '0x0' }] }

    beforeEach(async () => {
      connector = new ThirdwebConnector(ChainId.ETHEREUM_MAINNET)
      thirdwebRequest = jest.fn().mockResolvedValue('0xhash')
      mockAutoConnect.mockResolvedValueOnce({ address: '0x1234567890abcdef1234567890abcdef12345678' })
      mockDefineChain.mockReturnValueOnce({ id: ChainId.ETHEREUM_MAINNET })
      mockToProvider.mockReturnValueOnce({ request: thirdwebRequest })
      mockCreateThirdwebClient.mockReturnValueOnce({ clientId: 'test' })
      provider = (await connector.activate()).provider as Provider
    })

    it('should strip non-standard fields on the request path', async () => {
      await provider.request(withExtra)
      expect(thirdwebRequest).toHaveBeenCalledWith(stripped)
    })

    it('should strip non-standard fields on the sendAsync path', async () => {
      await provider.sendAsync(withExtra)
      expect(thirdwebRequest).toHaveBeenCalledWith(stripped)
    })

    it('should forward non-transaction methods unchanged', async () => {
      const signRequest = { method: 'personal_sign', params: ['0xdeadbeef', '0xsigner'] }
      await provider.request(signRequest)
      expect(thirdwebRequest).toHaveBeenCalledWith(signRequest)
    })
  })
})

describe('stripUnknownTxParams', () => {
  const request = (tx: unknown, ...rest: unknown[]) => [{ method: 'eth_sendTransaction', params: [tx, ...rest] }]

  it('should drop non-standard fields (extraCallData and the input alias) from the transaction', () => {
    const [{ params }] = stripUnknownTxParams(
      request({ to: '0xdef', data: '0x', value: '0x0', extraCallData: '0xa9059cbb', input: '0xa9059cbb' })
    )

    expect(params[0]).toEqual({ to: '0xdef', data: '0x', value: '0x0' })
  })

  it('should leave a standard transaction untouched', () => {
    const tx = { from: '0xabc', to: '0xdef', value: '0x0', data: '0x', gas: '0x5208' }

    const [{ params }] = stripUnknownTxParams(request(tx))

    expect(params[0]).toEqual(tx)
  })

  it('should preserve the method and any params beyond the transaction object', () => {
    const [{ method, params }] = stripUnknownTxParams(request({ to: '0xdef', extraCallData: '0xdead' }, 'latest'))

    expect(method).toBe('eth_sendTransaction')
    expect(params[1]).toBe('latest')
  })

  it.each([
    ['a non-object first param', ['not-an-object']],
    ['an empty params list', []]
  ])('should return the arguments unchanged for %s', (_label, params) => {
    const args = [{ method: 'eth_sendTransaction', params }]

    expect(stripUnknownTxParams(args)).toBe(args)
  })

  it('should keep standard type-4 fields such as authorizationList', () => {
    const tx = { to: '0xdef', data: '0x', type: '0x4', authorizationList: [{ chainId: '0x1' }] }

    const [{ params }] = stripUnknownTxParams(request(tx))

    expect(params[0]).toEqual(tx)
  })

  it('should not throw and should return the arguments unchanged when params is not an array', () => {
    const args = [{ method: 'eth_sendTransaction', params: { 0: { to: '0xdef' } } }]

    expect(() => stripUnknownTxParams(args)).not.toThrow()
    expect(stripUnknownTxParams(args)).toBe(args)
  })
})
