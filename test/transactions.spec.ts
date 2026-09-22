import { findNonStandardTransactionParam, STANDARD_ETH_SEND_TRANSACTION_FIELDS } from '../src/transactions'

describe('findNonStandardTransactionParam', () => {
  it('should return null when every field is standard', () => {
    const txParams = { from: '0xabc', to: '0xdef', value: '0x0', data: '0x', gas: '0x5208' }

    expect(findNonStandardTransactionParam(txParams)).toBeNull()
  })

  it('should return the non-standard field name', () => {
    expect(findNonStandardTransactionParam({ to: '0xdef', data: '0x', extraCallData: '0xa9059cbb' })).toBe('extraCallData')
  })

  it('should treat the input calldata alias as non-standard', () => {
    expect(findNonStandardTransactionParam({ to: '0xdef', input: '0xa9059cbb' })).toBe('input')
  })

  it('should keep standard type-4 fields such as authorizationList', () => {
    expect(findNonStandardTransactionParam({ to: '0xdef', type: '0x4', authorizationList: [{ chainId: '0x1' }] })).toBeNull()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an array', ['0xdef']]
  ])('should return null for %s', (_label, value) => {
    expect(findNonStandardTransactionParam(value)).toBeNull()
  })
})

describe('STANDARD_ETH_SEND_TRANSACTION_FIELDS', () => {
  it('should include the standard fields and exclude non-standard ones', () => {
    expect(STANDARD_ETH_SEND_TRANSACTION_FIELDS.has('data')).toBe(true)
    expect(STANDARD_ETH_SEND_TRANSACTION_FIELDS.has('authorizationList')).toBe(true)
    expect(STANDARD_ETH_SEND_TRANSACTION_FIELDS.has('extraCallData')).toBe(false)
    expect(STANDARD_ETH_SEND_TRANSACTION_FIELDS.has('input')).toBe(false)
  })
})
