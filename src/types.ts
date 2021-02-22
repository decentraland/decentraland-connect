import { ChainId } from '@dcl/schemas'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { EventEmitter } from 'events'

export enum ProviderType {
  INJECTED = 'injected',
  FORTMATIC = 'formatic',
  NETWORK = 'network',
  WALLET_CONNECT = 'wallet_connect'
}

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}
export interface Provider extends EventEmitter {
  request: (reqArgs: RequestArguments) => Promise<unknown>
  send: (
    method: RequestArguments['method'],
    params: RequestArguments['params']
  ) => Promise<unknown>
}

export type LegacyProvider = Pick<Provider, 'send'>

export type ConnectionData = {
  providerType: ProviderType
  chainId: ChainId
}

export type ConnectionResponse = {
  provider: Provider
  chainId: ChainId
  account: null | string
}

export interface ClosableConnector extends AbstractConnector {
  close: () => Promise<void>
}
