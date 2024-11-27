import { ChainId } from '@dcl/schemas'
import { MagicConnector } from './MagicConnector'

export class MagicTestConnector extends MagicConnector {
  constructor(desiredChainId: ChainId) {
    super(desiredChainId, true)
  }
}
