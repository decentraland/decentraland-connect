import { ChainId } from '@dcl/schemas'
import { io } from 'socket.io-client'

export class AuthServerProvider {
  private chainId = ChainId.ETHEREUM_MAINNET
  private account?: string

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

    const socket = io('https://auth-api.decentraland.zone')

    await new Promise<void>(resolve => {
      socket.on('connect', resolve)
    })

    const requestResponse = await socket.emitWithAck('request', {
      method: payload.method,
      params: payload.params
    })

    if (requestResponse.error) {
      throw new Error(requestResponse.error)
    }

    window.open(
      `https://decentraland.zone/auth/requests/${requestResponse.requestId}`,
      '_blank',
      'noopener,noreferrer'
    )

    const result = await new Promise(resolve => {
      const onMessage = (msg: any) => {
        if (msg.requestId === requestResponse.requestId) {
          socket.off('message', onMessage)

          if (payload.method === 'dcl_personal_sign') {
            resolve({
              signer: msg.sender,
              signature: msg.result
            })
          } else {
            resolve(msg.result)
          }
        }
      }

      socket.on('outcome', onMessage)
    })

    socket.disconnect()

    return result
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
