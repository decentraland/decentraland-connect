<img src="https://ui.decentraland.org/decentraland_256x256.png" height="128" width="128" />

# Decentraland Connect

Connect to the Ethereum network with ease

# Table of content

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

## API

The API surface is fairly small, you'll mainly be using the exported `connection` object, which is an instance of the also exported `ConnectionManager` using the default `LocalStorage`.

### ConnectionManager

Handles the connection to the Ethereum network. It takes a [`Storage`](#Storage) as the only argument, which will be used to store the last used connection.

#### .connect()

**Definition**

**Usage**

**Response**
A [`ConnectionResponse`](#ConnectionResponse) object

#### .disconnect()

**Definition**

**Usage**

#### .getAvialableProviders()

**Definition**

**Usage**

**Response**

#### .getProvider()

**Definition**

**Usage**

**Response**

#### .createProvider()

**Definition**

**Usage**

**Response**

### connection

Instance of [`ConnectionManager`](#ConnectionManager), using [`LocalStorage`](#LocalStorage) as it's internal storage engine, which translates to:

```typescript
export const connection = new ConnectionMager(new LocalStorage())
```

### Storage

Abstract class that defines the methods needed to create a new Storage engine. It only defines two methods:

```typescript
abstract get(key: string): any | undefined
abstract set(key: string, value: any): void
```

#### LocalStorage

An implementation of the Storage engine which uses `window.localStorage` to store data

### Types

#### ProviderType

```typescript
export enum ProviderType {
  INJECTED = 'injected',
  FORTMATIC = 'formatic',
  WALLET_CONNECT = 'wallet_connect'
}
```

#### ChainId

```typescript
export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  KOVAN = 42
}
```

#### ConnectionResponse

```typescript
export type ConnectResponse = {
  provider: Provider
  chainId: ChainId
  account: null | string
}
```

## Example use

```typescript
import {
  connection,
  ConnectResponse,
  ProviderType,
  ChainId
} from 'decentraland-connection'

async function connect() {
  let result: ConnectResponse
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

### Development

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

## Copyright

This repository is protected with a standard Apache 2 license. See the terms and conditions in the [LICENSE](https://github.com/decentraland/decentraland-connect/blob/master/LICENSE) file.
