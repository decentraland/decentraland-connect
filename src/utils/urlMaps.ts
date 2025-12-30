import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'

export function toRpcUrlRecord(
  urls: Partial<Record<ChainId, string>>
): Record<number, string> {
  const entries = Object.entries(urls) as [string, string | undefined][]

  return Object.fromEntries(
    entries
      .filter((entry): entry is [string, string] => !!entry[1])
      .map(([chainId, url]) => [Number(chainId), url])
  ) as Record<number, string>
}
