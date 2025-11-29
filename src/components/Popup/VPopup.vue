<template>
  <div
    :class="['popup-notification', popupClass, { 'popup--visible': visible, 'popup-modal': $slots.footer }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <header class="popup-header">
      <div class="popup-title">
        <div class="popup-icon-wrapper">
          <font-awesome-icon :icon="['fas', icon]" class="popup-icon" />
        </div>
        <h4>{{ msg }}</h4>
      </div>
      <button class="popup-close" @click="close">
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>
    </header>

    <section class="popup-body" v-if="$slots.default">
      <slot></slot>
    </section>

    <footer class="popup-footer" v-if="$slots.footer">
      <slot name="footer">
        <button class="popup-button" @click="close">Fechar</button>
      </slot>
    </footer>

    <div class="popup-progress" v-if="autoClose > 0 && visible">
      <div class="popup-progress-bar" :style="{ animationDuration: `${autoClose}ms` }"></div>
    </div>
  </div>
</template>

<script>
import './VPopup.css'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  components: { FontAwesomeIcon },
  props: {
    msg: {
      type: String,
      required: true,
    },
    mark: {
      type: String,
      required: true,
      validator: (value) => ['success', 'danger', 'warning', 'info'].includes(value),
    },
    visible: {
      type: Boolean,
      default: false,
    },
    autoClose: {
      type: Number,
      default: 5000,
    },
  },
  emits: ['update:visible', 'close'],
  data() {
    return {
      timer: null,
    }
  },
  computed: {
    popupClass() {
      return `popup--${this.mark}`
    },
    icon() {
      switch (this.mark) {
        case 'success':
          return 'check-circle'
        case 'danger':
          return 'exclamation-triangle'
        case 'warning':
          return 'exclamation-circle'
        case 'info':
          return 'info-circle'
        default:
          return 'info-circle'
      }
    },
  },
  watch: {
    visible(val) {
      if (val && this.autoClose > 0) {
        this.startAutoClose()
      } else {
        this.clearAutoClose()
      }
    },
  },
  mounted() {
    if (this.visible && this.autoClose > 0) {
      this.startAutoClose()
    }
  },
  beforeUnmount() {
    this.clearAutoClose()
  },
  methods: {
    close() {
      this.$emit('update:visible', false)
      this.$emit('close')
      this.clearAutoClose()
    },
    startAutoClose() {
      this.clearAutoClose()
      this.timer = setTimeout(() => {
        this.close()
      }, this.autoClose)
    },
    clearAutoClose() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    pauseAutoClose() {
      this.clearAutoClose()
    },
    resumeAutoClose() {
      if (this.visible && this.autoClose > 0 && !this.$slots.footer) {
        this.startAutoClose()
      }
    },
    handleMouseEnter() {
      if (!this.$slots.footer) {
        this.pauseAutoClose()
      }
    },
    handleMouseLeave() {
      if (!this.$slots.footer) {
        this.resumeAutoClose()
      }
    },
  },
}
</script>
