import { expect } from 'chai'
import Sinon from 'sinon'
import sinon from 'sinon'
import { LocalStorage } from '../src/storage'

describe('LocalStorage', () => {
  const browser: any = global
  const windowLocalStorage = {
    getItem: (_key: string) => {},
    setItem: (_key: string, _value: any) => {},
    clear: () => {}
  }
  let mockStorage: Sinon.SinonMock

  beforeEach(() => {
    mockStorage = sinon.mock(windowLocalStorage)
    browser.window = { localStorage: windowLocalStorage }
  })

  afterEach(() => {
    mockStorage.restore()
    browser.window = undefined
  })

  describe('#get', () => {
    it('should call the window localStorage get method', () => {
      const key = 'key'
      const value = 'value'
      mockStorage
        .expects('getItem')
        .once()
        .withArgs(key)
        .returns(value)

      const localStorage = new LocalStorage()
      const result = localStorage.get(key)

      mockStorage.verify()
      expect(result).to.eq(value)
    })

    it('should return undefined when the key does not exist', () => {
      const key = 'key'
      mockStorage
        .expects('getItem')
        .once()
        .withArgs(key)
        .returns(null)

      const localStorage = new LocalStorage()
      const result = localStorage.get(key)

      mockStorage.verify()
      expect(result).to.eq(undefined)
    })
  })

  describe('#set', () => {
    it('should call the window localStorage set method', () => {
      const key = 'key'
      const value = 'value'
      mockStorage
        .expects('setItem')
        .once()
        .withArgs(key, value)

      const localStorage = new LocalStorage()
      localStorage.set(key, value)
    })
  })

  describe('#clear', () => {
    it('should call the window localStorage clear method', () => {
      mockStorage.expects('clear').once()

      const localStorage = new LocalStorage()
      localStorage.clear()
    })
  })
})
