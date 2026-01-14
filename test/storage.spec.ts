import { LocalStorage } from '../src/storage'

describe('LocalStorage', () => {
  const browser: any = global
  let windowLocalStorage: {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
  }

  beforeEach(() => {
    windowLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    }
    browser.window = { localStorage: windowLocalStorage }
  })

  afterEach(() => {
    delete browser.window
  })

  describe('#get', () => {
    it('should call the window localStorage get method', () => {
      const key = 'key'
      const value = 'value'
      windowLocalStorage.getItem.mockReturnValue(value)

      const localStorage = new LocalStorage()
      const result = localStorage.get(key)

      expect(windowLocalStorage.getItem).toHaveBeenCalledWith(key)
      expect(windowLocalStorage.getItem).toHaveBeenCalledTimes(1)
      expect(result).toBe(value)
    })

    it('should return undefined when the key does not exist', () => {
      const key = 'key'
      windowLocalStorage.getItem.mockReturnValue(null)

      const localStorage = new LocalStorage()
      const result = localStorage.get(key)

      expect(windowLocalStorage.getItem).toHaveBeenCalledWith(key)
      expect(windowLocalStorage.getItem).toHaveBeenCalledTimes(1)
      expect(result).toBe(undefined)
    })
  })

  describe('#set', () => {
    it('should call the window localStorage set method', () => {
      const key = 'key'
      const value = 'value'

      const localStorage = new LocalStorage()
      localStorage.set(key, value)

      expect(windowLocalStorage.setItem).toHaveBeenCalledWith(key, value)
      expect(windowLocalStorage.setItem).toHaveBeenCalledTimes(1)
    })
  })

  describe('#remove', () => {
    it('should call the window localStorage removeItem method', () => {
      const key = 'key'

      const localStorage = new LocalStorage()
      localStorage.remove(key)

      expect(windowLocalStorage.removeItem).toHaveBeenCalledWith(key)
      expect(windowLocalStorage.removeItem).toHaveBeenCalledTimes(1)
    })
  })
})
