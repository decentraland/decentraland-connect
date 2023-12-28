import { ChainId, ProviderType } from '@dcl/schemas'
import { ethers } from 'ethers'
import { Socket, io } from 'socket.io-client'
import { Authenticator, AuthIdentity, AuthLinkType } from '@dcl/crypto'
import * as sso from '@dcl/single-sign-on-client'
import { getRpcUrls } from '../configuration'

const STORAGE_KEY_ADDRESS = 'auth-server-provider-address'
const STORAGE_KEY_CHAIN_ID = 'auth-server-provider-chain-id'

export class AuthServerProvider {
  private static authServerUrl: string = ''
  private static authDappUrl: string = ''
  private static identityExpirationInMillis: number = 30 * 24 * 60 * 60 * 1000 // 30 days in the future.

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
   * Set the time it will take for the identity created on 'finishSignIn' to expire.
   */
  static setIdentityExpiration(millis: number) {
    AuthServerProvider.identityExpirationInMillis = millis
  }

  /**
   * Initializes the first part of the sign in process.
   * It returns data such as the request expiration as well as the verification code which can be used on the frontend.
   * The returned data should be passed back to the `finishSignIn` method.
   */
  static initSignIn = async () => {
    const socket = await AuthServerProvider.getSocket()

    const ephemeralAccount = ethers.Wallet.createRandom()
    const expiration = new Date(
      Date.now() + AuthServerProvider.identityExpirationInMillis
    )
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
          type: AuthLinkType.ECDSA_PERSONAL_EPHEMERAL,
          payload: ephemeralMessage,
          signature: signature
        }
      ]
    }

    localStorage.setItem(STORAGE_KEY_ADDRESS, signer.toLowerCase())
    sso.localStorageStoreIdentity(signer, identity)
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
    const chainId = localStorage.getItem(STORAGE_KEY_CHAIN_ID)

    if (!chainId) {
      return ChainId.ETHEREUM_MAINNET
    }

    return Number(chainId) as ChainId
  }

  getAccount = () => {
    return localStorage.getItem(STORAGE_KEY_ADDRESS)
  }

  getIdentity = () => {
    const account = this.getAccount()

    if (!account) {
      return null
    }

    return sso.localStorageGetIdentity(account)
  }

  request = async (payload: {
    method: string
    params: string[]
  }): Promise<any> => {
    if (['eth_chainId', 'net_version'].includes(payload.method)) {
      return this.getChainId()
    }

    if (['eth_accounts', 'eth_requestAccounts'].includes(payload.method)) {
      const account = this.getAccount()

      if (!account) {
        return []
      } else {
        return [account]
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
        getRpcUrls(ProviderType.AUTH_SERVER)[this.getChainId()]
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

  deactivate = () => {
    const account = this.getAccount()

    if (account) {
      sso.localStorageClearIdentity(account)
    }

    localStorage.removeItem(STORAGE_KEY_ADDRESS)
    localStorage.removeItem(STORAGE_KEY_CHAIN_ID)
  }
}
