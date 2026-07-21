import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { MagicConnector } from '../src/connectors/MagicConnector'

describe('MagicConnector', () => {
  let connector: MagicConnector
  let isLoggedIn: jest.Mock
  let getInfo: jest.Mock

  beforeEach(() => {
    connector = new MagicConnector(ChainId.ETHEREUM_MAINNET)
    isLoggedIn = jest.fn()
    getInfo = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when getting the email', () => {
    describe('and the magic instance is not initialized', () => {
      it('should return undefined', async () => {
        const email = await connector.getEmail()
        expect(email).toBeUndefined()
      })
    })

    describe('and the magic instance is initialized', () => {
      beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(connector as any).magic = { user: { isLoggedIn, getInfo } }
      })

      describe('and the user is not logged in', () => {
        beforeEach(() => {
          isLoggedIn.mockResolvedValueOnce(false)
        })

        it('should return undefined without calling getInfo', async () => {
          const email = await connector.getEmail()
          expect(email).toBeUndefined()
          expect(getInfo).not.toHaveBeenCalled()
        })
      })

      describe('and the user is logged in with an email', () => {
        beforeEach(() => {
          isLoggedIn.mockResolvedValueOnce(true)
          getInfo.mockResolvedValueOnce({ email: 'user@example.com' })
        })

        it('should return the email', async () => {
          const email = await connector.getEmail()
          expect(email).toBe('user@example.com')
        })
      })

      describe('and the user is logged in without an email', () => {
        beforeEach(() => {
          isLoggedIn.mockResolvedValueOnce(true)
          getInfo.mockResolvedValueOnce({ email: null })
        })

        it('should return undefined', async () => {
          const email = await connector.getEmail()
          expect(email).toBeUndefined()
        })
      })

      describe('and reading the user info throws', () => {
        beforeEach(() => {
          isLoggedIn.mockRejectedValueOnce(new Error('boom'))
        })

        it('should resolve to undefined without throwing', async () => {
          await expect(connector.getEmail()).resolves.toBeUndefined()
        })
      })
    })
  })
})
