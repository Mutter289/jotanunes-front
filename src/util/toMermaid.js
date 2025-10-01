// Converte o JSON do endpoint /api/v2/dependencias/itens/{id}/json-model
// para um diagrama Mermaid (flowchart). Oculta a origem na lista de dependências.

export function toMermaidFlowchart(model) {
  if (!model) return 'flowchart LR\n  empty[Sem dados]'

  const title = sanitize(`${model.titulo_dependencia || 'Item'}`)
  const versao = sanitize(`${model.versao || ''}`)
  const criado = sanitize(`${model.criado || ''}`)

  const lines = []
  lines.push('flowchart LR')
  lines.push('  classDef origem fill:#eef,stroke:#36c,stroke-width:1px')
  lines.push('  classDef dep fill:#efe,stroke:#3c6,stroke-width:1px')
  lines.push('  classDef meta fill:#f7f7f7,stroke:#bbb,stroke-dasharray: 3 3')

  // Nó principal (metadados)
  const mainId = nodeId('main')
  lines.push(`  ${mainId}(["${title}<br/>${versao}<br/>${criado}"]):::meta`)

  // Origem
  if (model.origem) {
    const origemId = nodeId('origem')
    const origemLabel = buildLabel(model.origem)
    lines.push(`  ${origemId}("${origemLabel}"):::origem`)
    lines.push(`  ${mainId} --> ${origemId}`)
  }

  // Dependências
  if (Array.isArray(model.dependencias)) {
    model.dependencias.forEach((d, idx) => {
      if (!d) return
      const depId = nodeId(`dep_${idx}`)
      const depLabel = buildLabel(d)
      lines.push(`  ${depId}("${depLabel}"):::dep`)
      lines.push(`  ${mainId} --> ${depId}`)
    })
  }

  return lines.join('\n')
}

function buildLabel(entry) {
  const tabela = sanitize(entry.tabela || '')
  const item = sanitize(String(entry.item || ''))
  const id = sanitize(String(entry.id ?? ''))
  return `${tabela}<br/>${item}<br/>[${id}]`
}

function nodeId(key) {
  return `n_${key.replace(/[^a-zA-Z0-9_]/g, '')}`
}

function sanitize(text) {
  return String(text).replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
