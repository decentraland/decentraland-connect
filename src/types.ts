import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'
import { ProviderType } from '@dcl/schemas/dist/dapps/provider-type'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { EventEmitter } from 'events'

export namespace Request {
  export type Method = string

  export type Params = readonly unknown[] | object

  export type Arguments = {
    readonly method: Method
    readonly params?: Params
    readonly jsonrpc?: string
    readonly id?: number
  }

  export type Callback = (err: number | null, value: any) => void
}

export interface Provider extends EventEmitter {
  isDapper: boolean
  isFortmatic: boolean
  isMetamask: boolean
  isMagic?: boolean
  request(reqArgs: Request.Arguments): Promise<unknown>
  send(method: Request.Method, params?: Request.Params): Promise<unknown>
  send(method: Request.Arguments, params?: Request.Callback): Promise<void>
  send(
    method: Request.Method | Request.Arguments,
    params?: Request.Params | Request.Callback
  ): Promise<unknown>
  sendAsync(method: Request.Arguments, params?: Request.Callback): Promise<void>
}

export type LegacyProvider = Pick<
  Provider,
  | 'send'
  | 'sendAsync'
  | 'on'
  | 'emit'
  | 'removeListener'
  | 'isDapper'
  | 'isFortmatic'
  | 'isMetamask'
>

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

export class ErrorUnlockingWallet extends Error {
  constructor() {
    super(
      'There was an error unlocking your wallet. Please be sure your wallet is unlocked and try again.'
    )
    this.name = 'ErrorUnlockingWallet'
  }
}
