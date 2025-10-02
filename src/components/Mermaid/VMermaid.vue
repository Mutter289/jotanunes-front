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
    theme: { type: String, default: 'default' }, // 'default' | 'dark' | 'forest' | 'neutral'
  },
  data() {
    return { error: null, renderKey: 0 }
  },
  watch: {
    diagram: {
      immediate: true,
      handler() {
        this.renderDiagram()
      },
    },
    theme() {
      this.renderDiagram()
    },
  },
  mounted() {
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: this.theme,
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif'
    })
    this.renderDiagram()
  },
  methods: {
    async renderDiagram() {
      try {
        this.error = null
        console.log('Renderizando diagrama Mermaid:', this.diagram)
        
        if (!this.diagram || this.diagram.trim() === '') {
          console.log('Diagrama vazio, não renderizando')
          return
        }
        
        // Reinitialize to apply theme changes
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: this.theme,
          securityLevel: 'loose',
          fontFamily: 'Arial, sans-serif'
        })

        const id = `mermaid-${Date.now()}-${++this.renderKey}`
        console.log('ID do diagrama:', id)
        
        // Tentar método mais antigo primeiro
        try {
          const { svg } = await mermaid.render(id, this.diagram)
          console.log('SVG gerado (novo método):', svg)
          
          if (this.$refs.container) {
            this.$refs.container.innerHTML = svg
          }
        } catch (renderError) {
          console.log('Método novo falhou, tentando método antigo:', renderError)
          
          // Método antigo (compatibilidade)
          const element = document.createElement('div')
          element.className = 'mermaid'
          element.textContent = this.diagram
          
          if (this.$refs.container) {
            this.$refs.container.innerHTML = ''
            this.$refs.container.appendChild(element)
            await mermaid.init(undefined, element)
          }
        }
      } catch (e) {
        this.error = 'Falha ao renderizar diagrama Mermaid'
        console.error('Erro ao renderizar Mermaid:', e)
      }
    },
  },
}
</script>

<style scoped>
.mermaid-error {
  color: #c00;
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>
