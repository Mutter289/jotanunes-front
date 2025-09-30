<template>
  <div ref="container"></div>
  <div v-if="error" class="mermaid-error">{{ error }}</div>
</template>

<script>
import mermaid from 'mermaid'

export default {
  name: 'VMermaid',
  props: {
    diagram: { type: String, required: true },
    theme: { type: String, default: 'default' } // 'default' | 'dark' | 'forest' | 'neutral'
  },
  data() {
    return { error: null, renderKey: 0 }
  },
  watch: {
    diagram: {
      immediate: true,
      handler() {
        this.renderDiagram()
      }
    },
    theme() {
      this.renderDiagram()
    }
  },
  mounted() {
    mermaid.initialize({ startOnLoad: false, theme: this.theme })
    this.renderDiagram()
  },
  methods: {
    async renderDiagram() {
      try {
        this.error = null
        // Reinitialize to apply theme changes
        mermaid.initialize({ startOnLoad: false, theme: this.theme })

        const id = `mermaid-${Date.now()}-${++this.renderKey}`
        const { svg } = await mermaid.render(id, this.diagram)
        if (this.$refs.container) {
          this.$refs.container.innerHTML = svg
        }
      } catch (e) {
        this.error = 'Falha ao renderizar diagrama Mermaid'
        // Opcional: console para debug
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }
  }
}
</script>

<style scoped>
.mermaid-error {
  color: #c00;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>


