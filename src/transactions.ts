// Standard eth_sendTransaction fields. thirdweb reads calldata only from `data`, so any other key (the `input` alias, extraCallData) is non-standard and would be signed without a consumer showing it.
export const STANDARD_ETH_SEND_TRANSACTION_FIELDS = new Set([
  'from',
  'to',
  'value',
  'data',
  'gas',
  'gasLimit',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'maxFeePerBlobGas',
  'nonce',
  'type',
  'chainId',
  'accessList',
  'blobVersionedHashes',
  'authorizationList'
])

// Returns the first eth_sendTransaction param outside the standard set, or null. Single source shared by this package's strip and by consumers' signing guards so the field list lives in one place.
export function findNonStandardTransactionParam(txParams: unknown): string | null {
  if (!txParams || typeof txParams !== 'object' || Array.isArray(txParams)) return null
  return Object.keys(txParams).find(key => !STANDARD_ETH_SEND_TRANSACTION_FIELDS.has(key)) ?? null
}
