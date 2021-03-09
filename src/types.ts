import { ChainId } from '@dcl/schemas'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { EventEmitter } from 'events'

export enum ProviderType {
  INJECTED = 'injected',
  FORTMATIC = 'formatic',
  NETWORK = 'network',
  WALLET_CONNECT = 'wallet_connect'
}

export namespace Request {
  export type Method = string

  export type Params = readonly unknown[] | object

  export type Arguments = {
    readonly method: Method
    readonly params?: Params
  }

  export type Callback = (err: number | null, value: any) => void
}

export interface Provider extends EventEmitter {
  isDapper: boolean
  request(reqArgs: Request.Arguments): Promise<unknown>
  send(method: Request.Method, params?: Request.Params): Promise<unknown>
  send(method: Request.Arguments, params?: Request.Callback): Promise<void>
  send(
    method: Request.Method | Request.Arguments,
    params?: Request.Params | Request.Callback
  ): Promise<unknown>
  sendAsync(method: Request.Arguments, params?: Request.Callback): Promise<void>
}

export type LegacyProvider = Pick<Provider, 'send' | 'sendAsync' | 'isDapper'>

export type ConnectionData = {
  providerType: ProviderType
  chainId: ChainId
}

export type ConnectionResponse = {
  provider: Provider
  providerType: ProviderType
  chainId: ChainId
  account: null | string
}

export interface ClosableConnector extends AbstractConnector {
  close: () => Promise<void>
}
