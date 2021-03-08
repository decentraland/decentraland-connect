import { LegacyProvider, Provider, Request } from './types'

// Shorthands
type Method = Request.Method
type Params = Request.Params
type Arguments = Request.Arguments
type Callback = Request.Callback

/**
 * Adapt popular provider methods to they can work across different popular web3 libs (such as web3x and ethers).
 * `sendAsync`, another popular method, is not being adapted here as we didn't find it necessary in our testing.
 * In case you need to adapt it, please create and issue or send a PR
 */
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
    return this.isModernProvider()
      ? (this.provider as Provider).request({ method, params })
      : this.provider.send(method, params)
  }

  async send(method: Method, params?: Params): Promise<unknown>
  async send(args: Arguments, callback: Callback): Promise<void>
  async send(
    methodOrArgs: Method | Arguments,
    paramsOrCallback?: Params | Callback
  ): Promise<unknown> {
    let method: Method
    let params: Params
    let callback: Callback
    const hasCallback = typeof paramsOrCallback === 'function'

    if (hasCallback) {
      const args = methodOrArgs as Arguments // if sendParams is a function, the first argument has all the other data
      params = args.params || []
      method = args.method
      callback = paramsOrCallback as Callback
    } else {
      method = methodOrArgs as Method
      params = paramsOrCallback || []
      callback = (_err, value) => value
    }

    if (this.isModernProvider()) {
      const result = await (this.provider as Provider).request({
        method,
        params
      })
      const returnValue = hasCallback
        ? { id: '', jsonrpc: '2.0', result }
        : result
      return callback(null, returnValue)
    } else {
      const [err, value]: [number | null, any] = hasCallback
        ? await new Promise(resolve =>
            this.provider.send(methodOrArgs, (err, value) => {
              resolve([err, value])
            })
          )
        : await this.provider.send(method, params).then(value => [null, value])

      return callback(err, value)
    }
  }

  isModernProvider(): boolean {
    return typeof this.provider['request'] === 'function'
  }
}
