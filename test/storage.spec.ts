import Sinon from 'sinon'
import sinon from 'sinon'
import { LocalStorage } from '../src/storage'

describe('LocalStorage', () => {
  const browser: any = global
  const windowLocalStorage = {
    getItem: (_key: string) => {},
    setItem: (_key: string, _value: any) => {}
  }
  let mockStorage: Sinon.SinonMock

  before(() => {
    mockStorage = sinon.mock(windowLocalStorage)
    browser.window = { localStorage: windowLocalStorage }
  })

  after(() => {
    mockStorage.restore()
    browser.window = undefined
  })

  describe('#get', () => {
    it('should call the window localStorage get method', () => {
      const key = 'key'
      mockStorage
        .expects('getItem')
        .once()
        .withArgs(key)

      const localStorage = new LocalStorage()
      localStorage.get(key)

      mockStorage.verify()
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
})
