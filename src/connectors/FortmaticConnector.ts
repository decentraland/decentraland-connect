import { AbstractConnector } from '@web3-react/abstract-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { ChainId, ProviderType } from '@dcl/schemas'
import { getConfiguration } from '../configuration'

export class FortmaticConnector extends AbstractConnector {
  private readonly apiKey: string
  private readonly chainId: number
  private readonly rpcUrl: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fortmatic: any

  constructor(chainId: ChainId) {
    const fortmaticConfiguration = getConfiguration()[ProviderType.FORTMATIC]
    const supportedChainIds = Object.keys(fortmaticConfiguration.apiKeys).map(key => Number(key))
    if (!supportedChainIds.includes(chainId)) {
      throw new Error(`Invariant error: Unsupported chainId ${chainId}`)
    }
    super({ supportedChainIds })

    this.apiKey = fortmaticConfiguration.apiKeys[chainId as keyof typeof fortmaticConfiguration.apiKeys]
    this.chainId = chainId
    this.rpcUrl = fortmaticConfiguration.urls[chainId as keyof typeof fortmaticConfiguration.urls]
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.fortmatic) {
      // @ts-expect-error - fortmatic has no type definitions
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { default: Fortmatic } = await import('fortmatic')
      this.fortmatic = new Fortmatic(this.apiKey, {
        rpcUrl: this.rpcUrl,
        chainId: this.chainId
      })
    }

    const account = await this.fortmatic
      .getProvider()
      .enable()
      .then((accounts: string[]): string => accounts[0])

    return {
      provider: this.fortmatic.getProvider(),
      chainId: this.chainId,
      account
    }
  }

  public getApiKey(): string {
    return this.apiKey
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getProvider(): Promise<any> {
    return this.fortmatic.getProvider()
  }

  public async getChainId(): Promise<number | string> {
    return this.chainId
  }

  public async getAccount(): Promise<null | string> {
    return this.fortmatic
      .getProvider()
      .send('eth_accounts')
      .then((accounts: string[]): string => accounts[0])
  }

  public deactivate() {}

  public close(): Promise<unknown> {
    return this.fortmatic.user.logout()
  }
}
