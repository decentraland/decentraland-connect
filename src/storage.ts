function get(key: string) {
  window.localStorage.getItem(key)
}

function set(key: string, value: any) {
  window.localStorage.setItem(key, value)
}
