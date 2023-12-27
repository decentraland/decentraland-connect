import { ChainId } from '@dcl/schemas'
import { ethers } from 'ethers'
import { Socket, io } from 'socket.io-client'
import { Authenticator, AuthIdentity, AuthLinkType } from '@dcl/crypto'
import * as sso from '@dcl/single-sign-on-client'
import { AuthServerConnector } from '../connectors'

export class AuthServerProvider {
  private static authServerUrl: string = ''
  private static authDappUrl: string = ''

  private chainId = ChainId.ETHEREUM_MAINNET
  private account?: string

  /**
   * Set the url of the auth server to be consumed by this provider.
   */
  static setAuthServerUrl(url: string) {
    AuthServerProvider.authServerUrl = url
  }

  /**
   * Set the url of the auth dapp to be consumed by this provider.
   */
  static setAuthDappUrl(url: string) {
    AuthServerProvider.authDappUrl = url
  }

  /**
   * Initializes the first part of the sign in process.
   * It returns data such as the request expiration as well as the verification code which can be used on the frontend.
   * The returned data should be passed back to the `finishSignIn` method.
   */
  static initSignIn = async () => {
    const socket = io(AuthServerProvider.authServerUrl)

    await new Promise<void>(resolve => {
      socket.on('connect', resolve)
    })

    const ephemeralAccount = ethers.Wallet.createRandom()
    const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days in the future.
    const ephemeralMessage = Authenticator.getEphemeralMessage(
      ephemeralAccount.address,
      expiration
    )

    const requestResponse = await socket.emitWithAck('request', {
      method: 'dcl_personal_sign',
      params: [ephemeralMessage]
    })

    if (requestResponse.error) {
      socket.disconnect()
      throw new Error(requestResponse.error)
    }

    return {
      socket,
      ephemeralAccount,
      expiration,
      ephemeralMessage,
      requestResponse
    }
  }

  /**
   * Should be called after the 'initSignIn' method with the same data it returned.
   * These methods are separate to allow the frontend to consume and display certain data before opening the auth dapp.
   */
  static finishSignIn = async ({
    socket,
    ephemeralAccount,
    expiration,
    ephemeralMessage,
    requestResponse
  }: {
    socket: Socket
    ephemeralAccount: ethers.HDNodeWallet
    expiration: Date
    ephemeralMessage: string
    requestResponse: any
  }) => {
    AuthServerProvider.openAuthDapp(requestResponse)

    const {
      sender: signer,
      result: signature
    } = await AuthServerProvider.awaitResultWithTimeout(socket, requestResponse)

    const identity: AuthIdentity = {
      expiration,
      ephemeralIdentity: {
        address: ephemeralAccount.address,
        privateKey: ephemeralAccount.privateKey,
        publicKey: ephemeralAccount.publicKey
      },
      authChain: [
        {
          type: AuthLinkType.SIGNER,
          payload: signer,
          signature: ''
        },
        {
          type:
            signature.length === 132
              ? AuthLinkType.ECDSA_PERSONAL_EPHEMERAL
              : AuthLinkType.ECDSA_EIP_1654_EPHEMERAL,
          payload: ephemeralMessage,
          signature: signature
        }
      ]
    }

    sso.localStorageStoreIdentity(signer, identity)

    localStorage.setItem(AuthServerConnector.PREVIOUS_ADDRESS_KEY, signer)
  }

  private static awaitResultWithTimeout = async (
    socket: Socket,
    requestResponse: any
  ) => {
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'))
      }, new Date(requestResponse.expiration).getTime() - Date.now())
    })

    const resultPromise = new Promise<any>(resolve => {
      const onMessage = (msg: any) => {
        if (msg.requestId === requestResponse.requestId) {
          socket.off('message', onMessage)
          resolve(msg)
        }
      }

      socket.on('outcome', onMessage)
    })

    const result = await Promise.race([timeoutPromise, resultPromise])

    socket.disconnect()

    return result
  }

  private static openAuthDapp = async (requestResponse: any) => {
    window.open(
      `${AuthServerProvider.authDappUrl}/requests/${requestResponse.requestId}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  getChainId = () => {
    return this.chainId
  }

  setChainId = (chainId: ChainId) => {
    this.chainId = chainId
  }

  getAccount = () => {
    return this.account
  }

  setAccount = (account: string) => {
    this.account = account
  }

  request = async (payload: {
    method: string
    params: string[]
  }): Promise<any> => {
    if (payload.method === 'eth_chainId') {
      return this.chainId
    }

    if (payload.method === 'net_version') {
      return this.chainId
    }

    if (payload.method === 'eth_accounts') {
      if (!this.account) {
        return []
      } else {
        return [this.account]
      }
    }

    const socket = io(AuthServerProvider.authServerUrl)

    await new Promise<void>(resolve => {
      socket.on('connect', resolve)
    })

    const requestResponse = await socket.emitWithAck('request', {
      method: payload.method,
      params: payload.params
    })

    if (requestResponse.error) {
      socket.disconnect()
      throw new Error(requestResponse.error)
    }

    AuthServerProvider.openAuthDapp(requestResponse)

    return AuthServerProvider.awaitResultWithTimeout(socket, requestResponse)
  }

  sendAsync = async (
    payload: {
      method: string
      params: string[]
    },
    callback: (err: number | null, value: any) => void
  ): Promise<void> => {
    try {
      const result = await this.request(payload)
      callback(null, result)
    } catch (e) {
      callback(999, (e as Error).message)
    }
  }
}
