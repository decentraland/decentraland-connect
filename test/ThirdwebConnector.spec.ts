import { ChainId } from '@dcl/schemas'
import { ThirdwebConnector } from '../src/connectors/ThirdwebConnector'

// Mock thirdweb modules as virtual modules (not installed)
const mockAutoConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockGetAccount = jest.fn()
const mockInAppWallet = jest.fn()
const mockDefineChain = jest.fn()
const mockToProvider = jest.fn()
const mockCreateThirdwebClient = jest.fn()

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
})
