// @flow
import treeProcessor from './treeProcessor'

// FIXME: Fake type just for documentation purposes.
type Registry = Object  // Asciidoctor::Extensions::Registry

/** Version of this module. */
export const VERSION = '0.3.0'

/**
 * @param registry The extensions registry to register this extension into.
 */
export function register (registry: Registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.treeProcessor(treeProcessor)
    })
  } else if (typeof registry.block === 'function') {
    registry.treeProcessor(treeProcessor)
  }
  return registry
}
