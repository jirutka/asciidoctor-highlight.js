// @flow
import hjs from 'highlight.js'

import applyAsciidoctorPolyfill from './asciidoctor-api-polyfill'
import calloutsSubs from './calloutsSubstitutor'
import passthroughsSubs from './passthroughsSubstitutor'

// FIXME: Fake types just for documentation purposes.
type Block = Object  // Asciidoctor::Block
type Document = Object  // Asciidoctor::Document
type Processor = Object  // Asciidoctor::Extensions::Processor


function removeSubstitution (block: Block, name: string): ?string {
  if (block.hasSubstitution(name)) {
    block.removeSubstitution(name)
    return name
  }
}

function blockLanguage (block: Block): ?string {
  return block.getAttribute('language', null, false)
      || block.getDocument().getAttribute('highlightjs-default-lang', 'none')
}

function isLanguageSupported (lang: ?string): boolean {
  return lang === 'auto' || hjs.getLanguage(lang)
}

function processListing (processor: Processor, block: Block): void {
  const lang = blockLanguage(block)
  let source = block.getSource()

  if (!isLanguageSupported(lang)) { return }

  // Don't escape special characters, highlight.js will take care of it.
  block.removeSubstitution('specialcharacters')

  let passthroughs
  if (removeSubstitution(block, 'macros')) {
    passthroughs = passthroughsSubs(processor, block)
    source = passthroughs.extract(source)
  }

  let callouts
  if (removeSubstitution(block, 'callouts')) {
    callouts = calloutsSubs(processor, block)
    source = callouts.extract(source)
  }

  source = block.applySubs(source, block.getSubstitutions())
  block.subs = []

  let html
  if (lang === 'auto') {
    const result = hjs.highlightAuto(source)
    block.setAttribute('language', result.language)
    html = result.value
  } else {
    html = hjs.highlight(lang, source, true).value
  }

  if (passthroughs) {
    html = passthroughs.restore(html)
  }
  let lines = html.split('\n')

  if (callouts) {
    // $FlowFixMe bug in Flow
    lines = lines.map((line, ln) => line + (callouts.convertLine(ln) || ''))
  }

  block.lines = lines
}

/**
 * Returns an Asciidoctor tree processor that highlights source listings
 * using Highlight.js.
 */
export default function () {

  applyAsciidoctorPolyfill()

  const processListings = (doc: Document): void => {
    doc.findBy({ context: 'listing', style: 'source' },
               block => processListing(this, block))
  }

  this.process((doc: Document): void => {
    if (!doc.isAttribute('source-highlighter', 'highlightjs-ext')) { return }

    processListings(doc)

    // Table cells may contain listing, but Document#findBy does not search
    // inside table, so we must handle it specially.
    doc.findBy({ context: 'table' }, table =>
      table.getRows().getBody().forEach(row =>
        row.forEach(cell => {
          const inner = cell.getInnerDocument()
          if (inner) { processListings(inner) }
        })
      )
    )
  })
}
