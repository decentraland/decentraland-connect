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

  request = (payload: { method: string; params: string[] }) => {
    return this.sendAsync(payload)
  }

  sendAsync = async ({
    method,
    params
  }: {
    method: string
    params: string[]
  }): Promise<any> => {
    const socket = io('http://localhost:8080')

    await new Promise<void>(resolve => {
      socket.on('connect', resolve)
    })

    const requestResponse = await socket.emitWithAck('request', {
      method,
      params
    })

    if (requestResponse.error) {
      throw new Error(requestResponse.error)
    }

    window.open(
      `http://127.0.0.1:5173/auth/requests/${requestResponse.requestId}`,
      '_blank',
      'noopener,noreferrer'
    )

    await new Promise()

    const result = await new Promise(resolve => {
      const onMessage = (msg: any) => {
        console.log(msg)

        if (msg.type === 'outcome' && msg.requestId === requestId) {
          socket.off('message', onMessage)
          if (
            payload.method === 'personal_sign' &&
            payload.params.length === 1
          ) {
            resolve({
              signer: msg.sender,
              signature: msg.result
            })
          } else {
            resolve(msg.result)
          }
        }
      }

      socket.on('message', onMessage)
    })

    socket.disconnect()

    console.log(result)

    return result
  }
}
