<template>
  <div>
    <div v-if="visible" class="offcanvas-backdrop" @click="close"></div>
    <transition :name="transitionName">
      <div v-if="visible" class="offcanvas" :class="side" :style="canvasStyle">
        <button class="offcanvas-close" @click="close">✕</button>
        <div class="offcanvas-content">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import './VOffcanvas.css'
export default {
  props: {
    modelValue: { type: Boolean, default: false }, // <- mudou
    side: {
      type: String,
      default: 'left',
      validator: (v) => ['left', 'right', 'top', 'bottom'].includes(v),
    },
    width: { type: String, default: '300px' },
    height: { type: String, default: '300px' },
  },
  emits: ['update:modelValue'],
  computed: {
    visible() {
      return this.modelValue
    },
    transitionName() {
      return `offcanvas-${this.side}`
    },
    canvasStyle() {
      return this.side === 'left' || this.side === 'right'
        ? { width: this.width }
        : { height: this.height }
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
  },
}
</script>
