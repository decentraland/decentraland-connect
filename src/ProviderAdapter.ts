import { LegacyProvider, Provider, Request } from './types'

// Shorthands
type Method = Request.Method
type Params = Request.Params
type Arguments = Request.Arguments
type Callback = Request.Callback

export class ProviderAdapter {
  constructor(public provider: LegacyProvider | Provider) {}

  static adapt(provider: LegacyProvider | Provider) {
    const providerAdapter = new ProviderAdapter(provider)
    return {
      ...provider,
      request: providerAdapter.request.bind(providerAdapter),
      send: providerAdapter.send.bind(providerAdapter)
    } as Provider
  }

  async request({ method, params }: Arguments) {
    return this.isLegacyProvider()
      ? this.provider.send(method, params)
      : (this.provider as Provider).request({ method, params })
  }

  async send(method: Method, params?: Params): Promise<unknown>
  async send(args: Arguments, callback: Callback): Promise<void>
  async send(
    methodOrArgs: Method | Arguments,
    paramsOrCallback?: Params | Callback
  ): Promise<unknown> {
    let method: Method
    let params: Params
    let callback: Callback | undefined

    if (typeof paramsOrCallback === 'function') {
      const args = methodOrArgs as Arguments // if sendParams is a function, the first argument has all the other data
      params = args.params || []
      method = args.method
      callback = paramsOrCallback as Callback
    } else {
      method = methodOrArgs as Method
      params = paramsOrCallback as Params
    }

    const result = await this.request({ method, params })

    if (callback) {
      const returnValue = { id: '', jsonrpc: '2.0', result }
      return callback(null, returnValue)
    } else {
      return result
    }
  }

  isLegacyProvider(): boolean {
    return (
      typeof this.provider['request'] === 'undefined' &&
      typeof this.provider['send'] !== 'undefined'
    )
  }
}
