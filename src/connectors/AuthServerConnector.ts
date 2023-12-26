import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from './AbstractConnector'
import { AuthServerProvider } from '../providers'
import * as sso from '@dcl/single-sign-on-client'
import { getConfiguration } from '../configuration'
import { ConnectionData } from '../types'
import { ChainId } from '@dcl/schemas'
import { ethers } from 'ethers'
import { AuthIdentity, AuthLinkType, Authenticator } from '@dcl/crypto'

const previousAddressKey = 'auth-server-connector-previous-address'

export class AuthServerConnector extends AbstractConnector {
  private provider: AuthServerProvider

  constructor() {
    super()
    this.provider = new AuthServerProvider()
  }

  activate = async (): Promise<ConnectorUpdate<string | number>> => {
    const previousAddress = localStorage.getItem(previousAddressKey)

    if (previousAddress) {
      const identity = sso.localStorageGetIdentity(previousAddress)

      if (identity) {
        if (identity.expiration >= new Date()) {
          const connectionDataString = localStorage.getItem(
            getConfiguration().storageKey
          )

          const connectionData: ConnectionData | null = connectionDataString
            ? JSON.parse(connectionDataString)
            : null

          const chainId = connectionData?.chainId ?? ChainId.ETHEREUM_MAINNET

          this.provider.setAccount(previousAddress)
          this.provider.setChainId(chainId)

          return {
            provider: this.provider,
            chainId: this.provider.getChainId(),
            account: this.provider.getAccount()
          }
        }
      }
    }

    const { address, privateKey, publicKey } = ethers.Wallet.createRandom()
    const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days in the future.
    const ephemeralMessage = Authenticator.getEphemeralMessage(
      address,
      expiration
    )

    const {
      signer,
      signature
    }: {
      signer: string
      signature: string
    } = await this.provider.request({
      method: 'dcl_personal_sign',
      params: [ephemeralMessage]
    })

    const identity: AuthIdentity = {
      expiration,
      ephemeralIdentity: {
        address,
        privateKey,
        publicKey
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

    this.provider.setAccount(signer)
    this.provider.setChainId(ChainId.ETHEREUM_MAINNET)

    sso.localStorageStoreIdentity(signer, identity)

    localStorage.setItem(previousAddressKey, signer.toLowerCase())

    return {
      provider: this.provider,
      chainId: this.provider.getChainId(),
      account: this.provider.getAccount()
    }
  }

  getProvider = async (): Promise<any> => {
    return this.provider
  }

  getChainId = async (): Promise<string | number> => {
    return this.provider.getChainId()
  }

  getAccount = async (): Promise<string | null> => {
    return this.provider.getAccount() ?? null
  }

  deactivate(): void {
    localStorage.removeItem(previousAddressKey)
  }
}
