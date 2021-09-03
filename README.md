<img src="https://ui.decentraland.org/decentraland_256x256.png" height="128" width="128" />

# Decentraland Connect

Connect to the Ethereum network with ease

# Table of contents

- [API](#api)
  - [ConnectionManager](#ConnectionManager)
  - [connection](#connection)
  - [Storage](#Storage)
    - [LocalStorage](#LocalStorage)
  - [Types](#types)
    - [ProviderType](#ProviderType)
    - [ChainId](#ChainId)
    - [ConnectionResponse](#ConnectionResponse)
- [Example](#example)
- [Development](#development)
- [Copyright](#copyright)

# API

The API surface is fairly small, you'll mainly be using the exported `connection` object, which is an instance of the also exported `ConnectionManager` using the default `LocalStorage`.

## ConnectionManager

Handles the connection to the Ethereum network. It takes a [`Storage`](#Storage) as the only argument, which will be used to store the last used connection.

### .connect()

Connects to the supplied provider type and chain. It'll default to `mainnet` if no chain is supplied. After a successfull call the params will be stored using the supplied [Storage](#Storage), which will allow you to call `tryPreviousConnection()`.

**Definition**

```typescript
async connect(
  providerType: ProviderType,
  chainId: ChainId = ChainId.ETHEREUM_MAINNET
): Promise<ConnectionResponse>
```

**Usage**

```typescript
const connection = new ConnectionManager(new Storage())
await connection.connect(ProviderType.INJECTED, ChainId.ETHEREUM_ROPSTEN)
```

### .tryPreviousConnection()

Will try to connect to the provider and chain stored from the last successfull `.connect()`. It'll throw otherwise.

**Definition**

```typescript
async tryPreviousConnection(): Promise<ConnectionResponse>
```

**Usage**

```typescript
// Calls connect first
const connection = new ConnectionManager(new Storage())
await connection.connect(ProviderType.INJECTED, ChainId.ETHEREUM_ROPSTEN)

await connection.tryPreviousConnection() // Connects with ProviderType.INJECTED ChainId.ETHEREUM.ROPSTEN
```

### .disconnect()

Disconnects the previous connection and clears the storage. It'll do nothing if no connection is found.

**Definition**

```typescript
async disconnect()
```

**Usage**

```typescript
const connection = new ConnectionManager(new Storage())
connection.connect(ProviderType.INJECTED, ChainId.ETHEREUM_ROPSTEN)

// (...)

connection.disconnect()
```

### .getConnectionData()

Returns the data used for the last successfull [.connect()](#connect) call. It's used by [.tryPreviousConnection](#trypreviousconnection) to determine which connection to use. Check [ConnectionData](#ConnectionData) for more info on the returned type

**Definition**

```typescript
getConnectionData(): ConnectionData | undefined
```

**Usage**

```typescript
const connection = new ConnectionManager(new Storage())
connection.connect(ProviderType.INJECTED, ChainId.ETHEREUM_ROPSTEN)

// (...)

const connectionData = connection.getConnectionData() // => connectionData is ConnectionData
```

### .getAvialableProviders()

Returns the providers available for connection. If for example no `window` object is found, `ProviderType.INJECTED` will not be returned on the list

**Definition**

```typescript
getAvailableProviders(): ProviderType[]
```

**Usage**

```typescript
connection.getAvailableProviders()
```

### .getProvider()

Get's the currently connected provider. It'll throw if no connection was made, similar to calling `.connect()` without params the first time

**Definition**

```typescript
async getProvider(): Promise<Provider>
```

**Usage**

```typescript
const provider = await connection.getProvider()
```

### .createProvider()

It creates a new provider using the supplied arguments. Similar to calling `.connect()` but without actually connecting.

**Definition**

```typescript
async createProvider(
  providerType: ProviderType,
  chainId: ChainId = ChainId.ETHEREUM_MAINNET
): Promise<Provider> {
```

**Usage**

```typescript
const provider = await connection.createProvider(
  Provider.FORTMATIC,
  ChainId.ETHEREUM_ROPSTEN
)
```

## connection

Instance of [`ConnectionManager`](#ConnectionManager), using [`LocalStorage`](#LocalStorage) as it's internal storage engine, which translates to:

```typescript
export const connection = new ConnectionMager(new LocalStorage())
```

## Storage

Abstract class that defines the methods needed to create a new Storage engine. It only defines two methods:

```typescript
abstract get(key: string): any | undefined
abstract set(key: string, value: any): void
abstract clear(): void
```

### LocalStorage

An implementation of the Storage engine which uses `window.localStorage` to store data

## Types

### ProviderType

Represents the different types of connectors to the Ethereum Network

```typescript
enum ProviderType {
  INJECTED = 'injected',
  FORTMATIC = 'formatic',
  NETWORK = 'network'
  WALLET_CONNECT = 'wallet_connect'
}
```

### ChainId

Different Ethereum chains

```typescript
enum ChainId {
  ETHEREUM_MAINNET = 1,
  ETHEREUM_ROPSTEN = 3,
  ETHEREUM_RINKEBY = 4,
  ETHEREUM_GOERLI = 5,
  ETHEREUM_KOVAN = 42,
  MATIC_MUMBAI = 13881,
  MATIC_MAINNET = 89
}
```

### ConnectionResponse

```typescript
type ConnectionResponse = {
  provider: Provider
  chainId: ChainId
  account: null | string
}
```

### ConnectionData

```typescript
type ConnectionData = {
  providerType: ProviderType
  chainId: ChainId
}
```

# Example

```typescript
import {
  connection,
  ConnectionResponse,
  ProviderType,
  ChainId
} from 'decentraland-connect'

async function connect() {
  let result: ConnectionResponse
  try {
    result = await connection.connect() // this will throw if no successful connect was called before
  } catch (error) {
    result = await connection.connect(ProviderType.FORTMATIC, ChainId.MAINNET)
  }
  return result
}

// If you're using something like React, you could do something like this (after trying a `.connect()`)
function showAvailableProviders() {
  const handleConect = useCallback((provider: ProviderType) =>
    connection.connect(provider, ChainId.MAINNET)
  )
  return connection
    .getAvailableProviders()
    .map(provider => (
      <div onClick={() => handleConnect(provider)}>{provider}</div>
    ))
}
```

# Development

To run the project you simply need to

```bash
npm i
npm run test
npm run build
```

you can also check the test report using

```bash
npm run test:report
```

# Copyright

This repository is protected with a standard Apache 2 license. See the terms and conditions in the [LICENSE](https://github.com/decentraland/decentraland-connect/blob/master/LICENSE) file.
