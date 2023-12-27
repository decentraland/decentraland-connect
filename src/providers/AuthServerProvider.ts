import { ChainId, ProviderType } from '@dcl/schemas'
import { ethers } from 'ethers'
import { Socket, io } from 'socket.io-client'
import { Authenticator, AuthIdentity, AuthLinkType } from '@dcl/crypto'
import * as sso from '@dcl/single-sign-on-client'
import { AuthServerConnector } from '../connectors'
import { getRpcUrls } from '../configuration'

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
    const socket = await AuthServerProvider.getSocket()

    const ephemeralAccount = ethers.Wallet.createRandom()
    const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days in the future.
    const ephemeralMessage = Authenticator.getEphemeralMessage(
      ephemeralAccount.address,
      expiration
    )

    const requestResponse = await AuthServerProvider.createRequest(socket, {
      method: 'dcl_personal_sign',
      params: [ephemeralMessage]
    })

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
    } = await AuthServerProvider.awaitOutcomeWithTimeout(
      socket,
      requestResponse
    )

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

  /**
   * Waits for an outcome message but times out if the expiration defined in the provided request is reached.
   */
  private static awaitOutcomeWithTimeout = async (
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

  /**
   * Opens the browser on the auth dapp requests page for the given request id.
   */
  private static openAuthDapp = (requestResponse: any) => {
    window.open(
      `${AuthServerProvider.authDappUrl}/requests/${requestResponse.requestId}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  /**
   * Creates a socket connection and waits for it to be connected before returning it.
   */
  private static getSocket = async () => {
    const socket = io(AuthServerProvider.authServerUrl)

    await new Promise<void>(resolve => {
      const onConnect = () => {
        socket.off('connect', onConnect)
        resolve()
      }

      socket.on('connect', onConnect)
    })

    return socket
  }

  /**
   * Emits an event to create a request with a given payload and waits for the response.
   */
  private static createRequest = async (socket: Socket, payload: any) => {
    const response = await socket.emitWithAck('request', {
      method: payload.method,
      params: payload.params
    })

    if (response.error) {
      socket.disconnect()
      throw new Error(response.error)
    }

    return response
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
    if (['eth_chainId', 'net_version'].includes(payload.method)) {
      return this.chainId
    }

    if (['eth_accounts'].includes(payload.method)) {
      if (!this.account) {
        return []
      } else {
        return [this.account]
      }
    }

    /**
     * These ethereum calls don't require the user's wallet given that no new transaction or signature is being created.
     * Because of this, we can use a regular provider to make the call, without the need of opening the auth dapp.
     */
    if (
      [
        'eth_call',
        'eth_getBalance',
        'eth_getCode',
        'eth_getTransactionCount',
        'eth_getStorageAt'
      ].includes(payload.method)
    ) {
      const provider = new ethers.JsonRpcProvider(
        getRpcUrls(ProviderType.AUTH_SERVER)[this.chainId]
      )

      return provider.send(payload.method, payload.params)
    }

    const socket = await AuthServerProvider.getSocket()

    const requestResponse = await AuthServerProvider.createRequest(socket, {
      method: payload.method,
      params: payload.params
    })

    AuthServerProvider.openAuthDapp(requestResponse)

    return AuthServerProvider.awaitOutcomeWithTimeout(socket, requestResponse)
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
