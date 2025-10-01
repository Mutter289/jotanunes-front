<template>
  <div class="diff-container">
    <div class="diff-column">
      <h4 class="diff-title">Versão Anterior</h4>
      <pre class="diff-code" style="color: var(--theme-color);">{{ oldSql || 'N/A' }}</pre>
    </div>
    <div class="diff-column">
      <h4 class="diff-title">Versão Atual</h4>
      <pre class="diff-code" style="color: green;">{{ newSql || 'N/A' }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SqlDiffViewer',
  props: {
    oldSql: String,
    newSql: String,
  },
}
</script>

<style scoped>
.diff-container {
  display: flex;
  gap: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}
.diff-column {
  flex: 1;
  min-width: 0;
}
.diff-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}
.diff-code {
  background: #ffffff;
  color: #333;
  padding: 12px;
  margin: 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
</style>
