// @flow

export class ExtMap<K, V> extends Map<K, V> {

  get <T: V | void> (key: K, defaultValue: T): V | T {
    const value = super.get(key)
    return value !== undefined ? value : defaultValue
  }
}

export function regexpEscape (str: string) {
  // Based on https://github.com/ljharb/regexp.escape.
  return str.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&')
}
