// @flow
import { regexpEscape, ExtMap } from './utils'

// FIXME: Fake types just for documentation purposes.
type AbstractNode = Object  // Asciidoctor::AbstractNode
type Processor = Object  // Asciidoctor::Extensions::Processor

// Copied from Asciidoctor::Substitutors::RS
const ESCAPE_CHAR = '\\'

// Copied from Asciidoctor::CalloutExtractRx
const EXTRACT_RX = /(?:(?:\/\/|#|--|;;) ?)?(\\)?<!?(|--)(\d+)\2>(?=(?: ?\\?<!?\2\d+\2>)*$)/

// Copied from Asciidoctor::CalloutExtractRxt
const EXTRACT_RXT = '(\\\\)?<()(\\d+)>(?=(?: ?\\\\?<\\d+>)*$)'

/**
 * Creates a substitutor for processing callouts inside a source listing block.
 */
export default (processor: Processor, node: AbstractNode) => {
  const callouts: ExtMap<number, Array<number>> = new ExtMap()
  const lineComment = node.getAttribute('line-comment')
  let docCallouts

  const calloutRx = lineComment
    ? new RegExp(`(?:${regexpEscape(lineComment)} )?${EXTRACT_RXT}`)
    : EXTRACT_RX

  /**
   * @param colnum The callout number.
   * @return An HTML markup of a callout marker with the given *colnum*.
   */
  function convertCallout (colnum: number): string {
    return processor
      .createInline(node, 'callout', colnum, { id: nextCalloutId() })
      .convert()
  }

  /**
   * @return An unique ID for next callout.
   */
  function nextCalloutId (): number {
    if (!docCallouts) {
      docCallouts = node.getDocument().getCallouts()
    }
    return docCallouts.readNextId()
  }

  return {
    get callouts () { return callouts },

    /**
    * Extracts and stashes callout markers from the given *text* for
    * reinsertion after processing.
    *
    * This should be used prior passing the source to a code highlighter.
    *
    * @param text The source of the listing block.
    * @return A copy of the *text* with callout marks removed.
    */
    extract (text: string): string {
      callouts.clear()

      return text.split('\n').map((line, ln) =>
        line.replace(calloutRx, (match, escape, _, callnum) => {
          if (escape === ESCAPE_CHAR) {
            return match.replace(ESCAPE_CHAR, '')
          }
          callouts.set(ln, [...callouts.get(ln, []), parseInt(callnum)])
          return ''
        })
      ).join('\n')
    },

    /**
    * Converts the extracted callout markers for the specified line.
    *
    * @param lineNum The line number (0-based).
    * @return A converted callout markers for the *lineNum*,
    *   or an empty string if there are no callouts for that line.
    */
    convertLine (lineNum: number): string {
      if (!callouts.has(lineNum)) { return '' }

      return callouts.get(lineNum, [])
        .map(convertCallout)
        .join(' ')
    },
  }
}
