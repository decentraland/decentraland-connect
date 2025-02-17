import { ChainId, ProviderType } from '@dcl/schemas'
import { ConnectorUpdate } from '@web3-react/types'
import { getConfiguration } from '../configuration'
import { AbstractConnector } from './AbstractConnector'
// tslint:disable-next-line
import type { InstanceWithExtensions, SDKBase } from '@magic-sdk/provider'
// tslint:disable-next-line
import type { OAuthExtension } from '@magic-ext/oauth2'

export class MagicConnector extends AbstractConnector {
  private chainId: ChainId
  private account: string | null
  private magic: InstanceWithExtensions<SDKBase, OAuthExtension[]> | undefined

  constructor(desiredChainId: ChainId, private readonly isTest: boolean = false) {
    super({ supportedChainIds: getConfiguration()[ProviderType.MAGIC].chains })
    this.chainId = desiredChainId
    this.account = null
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    this.magic = await this.buildMagicInstance(this.chainId)
    const isLoggedIn = await this.magic.user.isLoggedIn()
    if (!isLoggedIn) {
      throw new Error('Magic: user isn\'t logged in')
    }
    const provider = await this.getProvider()
    const accounts: string[] = (await provider.request({ method: 'eth_accounts' }))
    this.account = accounts[0] ?? null

    return {
      provider,
      chainId: this.chainId,
      account: this.account
    }
  }

  getProvider = async (): Promise<any> => {
    if (!this.magic) {
      throw new Error('Magic: instance was not initialized')
    }

    const provider = await this.magic.wallet.getProvider()
    return { ...provider, isMagic: true, request: new Proxy(provider.request, {
      apply: async (target, _thisArg, argumentsList) => {
        // Magic doesn't support the "wallet_switchEthereumChain" method, we need to re-instantiate the Magic instance
        if (argumentsList[0]?.method === 'wallet_switchEthereumChain') {
          try {
            const chainId = parseInt(argumentsList[0]?.params[0]?.chainId, 16)
            if (this.supportedChainIds && !this.supportedChainIds.includes(chainId)) {
              return {
                code: 2020202,
                message: 'Unsupported Magic ChainId'
              }
            }

            this.magic = await this.buildMagicInstance(chainId)
            this.emitUpdate({ chainId })
            return null
          } catch (error) {
            return {
              code: 2020201,
              message: 'Error changing the Magic ChainId'
            }
          }
        }
        return target.bind(provider)(...argumentsList)
      }
    }), sendAsync: new Proxy(provider.send, {
      apply: async (target, _thisArg, argumentsList) => {
        return target.bind(provider)(...argumentsList)
      }
    })}
  }

  getChainId = async (): Promise<number | string> => {
    if (!this.magic) {
      throw new Error('Magic: instance was not initialized')
    }

    return this.chainId
  }

  getAccount = async (): Promise<null | string> => {
    if (!this.magic) {
      throw new Error('Magic: instance was not initialized')
    }
    return this.account
  }

  public close(): Promise<boolean> {
    if (!this.magic) {
      throw new Error('Magic: instance was not initialized')
    }
    return this.magic.user.logout()
  }

  deactivate = (): void => undefined

  private buildMagicInstance = async (chainId: ChainId): Promise<InstanceWithExtensions<SDKBase, OAuthExtension[]>> => {
    const { Magic } = await import('magic-sdk')
    const { OAuthExtension } = await import('@magic-ext/oauth2')
    const magicConfiguration = getConfiguration()[this.isTest ? ProviderType.MAGIC_TEST : ProviderType.MAGIC]
    return new Magic(magicConfiguration.apiKey, {
      extensions: [new OAuthExtension()],
      network: {
        rpcUrl: magicConfiguration.urls[chainId],
        chainId: chainId
      }
    })
  }
}
