import { expect } from 'chai'
import sinon from 'sinon'
import { ProviderAdapter } from '../src/ProviderAdapter'
import { LegacyProvider, Provider, Request } from '../src/types'

describe('ProviderAdapter', () => {
  const mock = (..._args: any[]) => { }

  describe('.adapt', () => {
    it('should return a new object adding the request and send methods', () => {
      const mockProvider = {} as any
      const adaptedProvider = ProviderAdapter.adapt(mockProvider)
      expect(typeof adaptedProvider.request).to.eq('function')
      expect(typeof adaptedProvider.send).to.eq('function')
    })
  })

  describe('#request', () => {
    it("should forward to the provider's send method if it's legacy", async () => {
      const provider = { send: (_args: any, callback: Request.Callback) => callback(null, result) } as Provider
      const result = 'value'
      const stub = sinon.stub(provider, 'send').yields(null, result)

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.request({ method, params })).to.eq(result)
      expect(stub.calledWith(
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        }
      )).to.eq(true)
    })

    it("should forward to the provider's request method if it exists", async () => {
      const provider = { request: mock, send: mock } as Provider
      const result = 'value'
      const stub = sinon
        .stub(provider, 'request')
        .returns(Promise.resolve(result))

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.request({ method, params })).to.eq(result)
      expect(stub.calledOnceWith({ method, params })).to.eq(true)
    })
  })

  describe('#send', () => {
    it("should forward to the provider's send if it lacks a request", async () => {
      const result = 'value'
      const provider = { send: (_args: any, callback: Request.Callback) => callback(null, result) } as Provider
      const stub = sinon.stub(provider, 'send').yields(null, result)

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      expect(await providerAdapter.send(method, params)).to.eq(result)
      expect(stub.calledWith(
        {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        }
      )).to.eq(true)
    })

    it('should should support a callback', async () => {
      const result = 'value'
      const provider = { request: mock, send: mock } as Provider
      const stub = sinon.stub(provider, 'request').returns(Promise.resolve(result))

      const method = 'method'
      const params = ['0x', 2]
      const providerAdapter = new ProviderAdapter(provider)

      const callbackMock = sinon.mock()
      const callback = (err: number | null, value: any) =>
        callbackMock(err, value)

      expect(await providerAdapter.send({ method, params }, callback)).to.eq(
        undefined
      )
      expect(stub.calledOnceWith({ method, params })).to.eq(true)
      expect(
        callbackMock.calledOnceWith(null, { id: '', jsonrpc: '2.0', result })
      ).to.eq(true)
    })
  })

  describe('#isModernProvider', () => {
    it('should return false if the provider supplied has a send method but lacks a request', () => {
      const provider = { send: mock } as LegacyProvider
      expect(new ProviderAdapter(provider).isModernProvider()).to.eq(false)
    })

    it('should return true if the provider supplied has a send and also has a request', () => {
      const provider = {
        request: mock,
        send: mock
      } as Provider
      expect(new ProviderAdapter(provider).isModernProvider()).to.eq(true)
    })

    it('should return true if the provider supplied has a request but lacks a send', () => {
      const provider = { request: mock } as Provider
      expect(new ProviderAdapter(provider).isModernProvider()).to.eq(true)
    })
  })
})
