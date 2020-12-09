import { AbstractConnector } from '@web3-react/abstract-connector'

export enum ProviderType {
  METAMASK = 'metamask',
  FORMATIC = 'formatic',
  WALLET_CONNECT = 'wallet_connect'
}

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  KOVAN = 42
}

export type RequestArguments = {
  readonly method: string
  readonly params?: readonly unknown[] | object
}
export interface Provider {
  request: (reqArgs: RequestArguments) => Promise<unknown>
}

export interface LegacyProvider {
  send: (
    method: RequestArguments['method'],
    params: RequestArguments['params']
  ) => Promise<unknown>
}

export type ConnectResponse = {
  provider: Provider
  chainId: ChainId
  account: null | string
}

export interface ClosableConnector extends AbstractConnector {
  close: () => Promise<void>
}
