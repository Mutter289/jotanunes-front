// Converte o JSON do endpoint /api/v2/dependencias/itens/{id}/json-model
// para um diagrama Mermaid (flowchart). Oculta a origem na lista de dependências.

export function toMermaidFlowchart(model) {
  if (!model) return 'flowchart LR\n  empty[Sem dados]'

  const lines = []
  // Aumenta escala em ~3x via fontSize e espaçamentos
  lines.push(
    "%%{init: { 'themeVariables': { 'fontSize': '36px' }, 'flowchart': { 'nodeSpacing': 100, 'rankSpacing': 140 } }}%%",
  )
  lines.push('flowchart LR')
  // Estilos por tipo de tabela
  lines.push('  classDef fv fill:#fff,stroke:#e91e63,stroke-width:2px') // rosa
  lines.push('  classDef sql fill:#fff,stroke:#2b6cb0,stroke-width:2px') // azul
  lines.push('  classDef rep fill:#fff,stroke:#16a34a,stroke-width:2px') // verde
  lines.push('  classDef other fill:#fff,stroke:#64748b,stroke-width:2px') // cinza

  // Origem: será o nó central (sem título/versão/criador)
  let origemId = null
  if (model.origem) {
    origemId = nodeId('origem')
    const origemLabel = buildLabel(model.origem)
    const origemClass = nodeClass(model.origem.tabela)
    lines.push(`  subgraph COL1[ ]`)
    lines.push(`    direction TB`)
    lines.push(`    ${origemId}("${origemLabel}"):::${origemClass}`)
    lines.push(`  end`)
    lines.push(`  style COL1 fill:transparent,stroke:none`)
  }

  // Dependências em colunas (AUD_SQLS ao centro, AUD_REPORT(S) à direita)
  const deps = Array.isArray(model.dependencias) ? model.dependencias.filter(Boolean) : []
  const sqls = deps.filter((d) => (d.tabela || '').toUpperCase() === 'AUD_SQLS')
  const reports = deps.filter((d) =>
    ['AUD_REPORT', 'AUD_REPORTS'].includes((d.tabela || '').toUpperCase()),
  )
  const others = deps.filter((d) => !sqls.includes(d) && !reports.includes(d))

  const sqlIds = []
  const reportIds = []

  // Coluna 2: SQLS (meio)
  if (sqls.length || others.length) {
    lines.push(`  subgraph COL2[ ]`)
    lines.push(`    direction TB`)
    sqls.forEach((d, idx) => {
      const depId = nodeId(`sql_${idx}`)
      sqlIds.push(depId)
      const depLabel = buildLabel(d)
      lines.push(`    ${depId}("${depLabel}"):::${nodeClass(d.tabela)}`)
    })
    // Itens "others" também ficam na coluna do meio
    others.forEach((d, idx) => {
      const depId = nodeId(`oth_${idx}`)
      sqlIds.push(depId)
      const depLabel = buildLabel(d)
      lines.push(`    ${depId}("${depLabel}"):::${nodeClass(d.tabela)}`)
    })
    lines.push(`  end`)
    lines.push(`  style COL2 fill:transparent,stroke:none`)
  }

  // Coluna 3: REPORTS (direita)
  if (reports.length) {
    lines.push(`  subgraph COL3[ ]`)
    lines.push(`    direction TB`)
    reports.forEach((d, idx) => {
      const depId = nodeId(`rep_${idx}`)
      reportIds.push(depId)
      const depLabel = buildLabel(d)
      lines.push(`    ${depId}("${depLabel}"):::${nodeClass(d.tabela)}`)
    })
    lines.push(`  end`)
    lines.push(`  style COL3 fill:transparent,stroke:none`)
  }

  // Ligações: origem -> todos do meio
  if (origemId) {
    sqlIds.forEach((id) => lines.push(`  ${origemId} --> ${id}`))
  }
  // Ligações: SQL(i) -> REPORT(i) (se existirem)
  for (let i = 0; i < Math.min(sqlIds.length, reportIds.length); i++) {
    lines.push(`  ${sqlIds[i]} --> ${reportIds[i]}`)
  }

  return lines.join('\n')
}

function buildLabel(entry) {
  const tabela = sanitize(entry.tabela || '')
  const item = sanitize(String(entry.item || ''))
  const id = sanitize(String(entry.id ?? ''))
  return `${tabela}<br/>${item}<br/>[${id}]`
}

function nodeClass(tabelaRaw) {
  const t = String(tabelaRaw || '').toUpperCase()
  if (t === 'AUD_FVS') return 'fv'
  if (t === 'AUD_SQLS') return 'sql'
  if (t === 'AUD_REPORT' || t === 'AUD_REPORTS') return 'rep'
  return 'other'
}

function nodeId(key) {
  return `n_${key.replace(/[^a-zA-Z0-9_]/g, '')}`
}

function sanitize(text) {
  return String(text).replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
