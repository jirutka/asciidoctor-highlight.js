// @flow
import { Opal } from 'opal-runtime'

// FIXME: Fake type just for documentation purposes.
type AbstractNode = Object  // Asciidoctor::AbstractNode


/**
 * Creates a substitutor for processing passthroughs inside listing blocks.
 * It's basically just a facade for Asciidoctor's internal methods.
 */
export default (_: any, node: AbstractNode) => {
  const Substitutors = Opal.const_get_qualified(Opal.Asciidoctor, 'Substitutors')
  const PASS_START_MARK = Opal.const_get_qualified(Substitutors, 'PASS_START')
  const PASS_END_MARK = Opal.const_get_qualified(Substitutors, 'PASS_END')

  // Copied from Asciidoctor::Substitutors::HighlightedPassSlotRx
  const PASS_SLOT_RX = new RegExp(
    `<span\\b[^>]*>${PASS_START_MARK}</span>[^\\d]*(\\d+)[^\\d]*<span\\b[^>]*>${PASS_END_MARK}</span>`, 'u')

  function hasPassthroughs () {
    try {
      // XXX: Using internal(?) Opal API.
      return node.$passthroughs().$$keys.length > 0
    } catch (_) {
      return true
    }
  }

  return {
    /**
    * Extracts passthrough regions from the given text for reinsertion
    * after processing.
    *
    * @param text The source of the node.
    * @return A copy of the *text* with passthrough regions substituted
    *   with placeholders.
    */
    extract (text: string): string {
      return node.extractPassthroughs(text)
    },

    /**
    * Restores the extracted passthroughs by reinserting them into the
    * placeholder positions.
    *
    * @param text The text into which to restore the passthroughs.
    * @return A copy of the *text* with restored passthroughs.
    */
    restore (text: string): string {
      if (!hasPassthroughs()) {
        return text
      }
      // Fix passthrough placeholders that got caught up in syntax highlighting.
      text = text.replace(PASS_SLOT_RX, `${PASS_START_MARK}\\1${PASS_END_MARK}`)

      // Restore converted passthroughs.
      return node.restorePassthroughs(text)
    },
  }
}
