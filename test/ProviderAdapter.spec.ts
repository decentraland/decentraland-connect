import { ProviderAdapter } from '../src/ProviderAdapter'
import { LegacyProvider, Provider, Request } from '../src/types'

describe('ProviderAdapter', () => {
  const mock = (..._args: unknown[]) => {}

  describe('.adapt', () => {
    it('should return a new object adding the request and send methods', () => {
      const mockProvider = {} as unknown as Provider
      const adaptedProvider = ProviderAdapter.adapt(mockProvider)
      expect(typeof adaptedProvider.request).toBe('function')
      expect(typeof adaptedProvider.send).toBe('function')
    })
  })

  describe('#request', () => {
    it("should forward to the provider's send method if it's legacy", async () => {
      const result = 'value'
      const provider = {
        send: jest.fn((_args: Request.Arguments, callback: Request.Callback) => callback(null, result))
      } as unknown as Provider

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.request({ method, params })).toBe(result)
      expect(provider.send).toHaveBeenCalledWith(
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        },
        expect.any(Function)
      )
    })

    it("should forward to the provider's request method if it exists", async () => {
      const result = 'value'
      const provider = {
        request: jest.fn().mockResolvedValue(result),
        send: mock
      } as unknown as Provider

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.request({ method, params })).toBe(result)
      expect(provider.request).toHaveBeenCalledWith({ method, params })
      expect(provider.request).toHaveBeenCalledTimes(1)
    })
  })

  describe('#send', () => {
    it("should forward to the provider's send if it lacks a request", async () => {
      const result = 'value'
      const provider = {
        send: jest.fn((_args: Request.Arguments, callback: Request.Callback) => callback(null, result))
      } as unknown as Provider

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.send(method, params)).toBe(result)
      expect(provider.send).toHaveBeenCalledWith(
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        },
        expect.any(Function)
      )
    })

    it('should should support a callback', async () => {
      const result = 'value'
      const provider = {
        request: jest.fn().mockResolvedValue(result),
        send: mock
      } as unknown as Provider

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      const callbackMock = jest.fn()
      const callback = (err: number | null, value: unknown) => callbackMock(err, value)

      expect(await providerAdapter.send({ method, params }, callback)).toBe(undefined)
      expect(provider.request).toHaveBeenCalledWith({ method, params })
      expect(provider.request).toHaveBeenCalledTimes(1)
      expect(callbackMock).toHaveBeenCalledWith(null, { id: '', jsonrpc: '2.0', result })
      expect(callbackMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('#isModernProvider', () => {
    it('should return false if the provider supplied has a send method but lacks a request', () => {
      const provider = { send: mock } as LegacyProvider
      expect(new ProviderAdapter(provider).isModernProvider()).toBe(false)
    })

    it('should return true if the provider supplied has a send and also has a request', () => {
      const provider = {
        request: mock,
        send: mock
      } as Provider
      expect(new ProviderAdapter(provider).isModernProvider()).toBe(true)
    })

    it('should return true if the provider supplied has a request but lacks a send', () => {
      const provider = { request: mock } as Provider
      expect(new ProviderAdapter(provider).isModernProvider()).toBe(true)
    })
  })
})
