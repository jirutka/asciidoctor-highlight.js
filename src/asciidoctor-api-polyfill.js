// @flow
declare var Opal: Object  // global variable

let loaded = false

// Polyfill for Asciidoctor.js API with methods we need.
export default () => {
  if (loaded) { return }

  const $AbstractBlock = Opal.const_get_qualified(Opal.Asciidoctor, 'AbstractBlock').$$proto

  if (!$AbstractBlock.applySubs) {
    $AbstractBlock.applySubs = function (text: string, subs: Array<string>): string {
      return this.$apply_subs(text, subs)
    }
  }
  // Internal method
  if (!$AbstractBlock.extractPassthroughs) {
    $AbstractBlock.extractPassthroughs = function (text: string): string {
      return this.$extract_passthroughs(text)
    }
  }
  // Internal method
  if (!$AbstractBlock.restorePassthroughs) {
    $AbstractBlock.restorePassthroughs = function (text: string, outer: boolean = true) {
      return this.$restore_passthroughs(text, outer)
    }
  }

  const $Callouts = Opal.const_get_qualified(Opal.Asciidoctor, 'Callouts').$$proto

  if (!$Callouts.readNextId) {
    $Callouts.readNextId = function (): string {
      return this.$read_next_id()
    }
  }

  const Table = Opal.const_get_qualified(Opal.Asciidoctor, 'Table')
  const $Table = Table.$$proto

  if (!$Table.getRows) {
    $Table.getRows = function () {
      return this.$rows()
    }
  }

  const $Row = Opal.const_get_qualified(Table, 'Rows').$$proto

  if (!$Row.getBody) {
    $Row.getBody = function () {
      return this.$body()
    }
  }

  const $Cell = Opal.const_get_qualified(Table, 'Cell').$$proto

  if (!$Cell.getInnerDocument) {
    $Cell.getInnerDocument = function () {
      const inner = this.$inner_document()
      return inner === Opal.nil ? undefined : inner
    }
  }

  loaded = true
}
