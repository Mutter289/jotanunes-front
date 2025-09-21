<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click="handleOverlayClick"
        :style="overlayStyles"
      >
        <div
          class="modal-container"
          @click.stop
          :style="containerStyles"
          :class="[`modal-${size}`, { 'modal-centered': centered }, customClass]"
        >
          <header v-if="showHeader" class="modal-header" :style="headerStyles">
            <div class="modal-title">
              <slot name="header">
                <h3 v-if="title">{{ title }}</h3>
              </slot>
            </div>
            <VButton
              v-if="showCloseButton"
              @click="close"
              class="modal-close-btn"
              :aria-label="closeAriaLabel"
              variant="ghost"
              text="&times;"
            />
          </header>
          <main class="modal-body" :style="bodyStyles">
            <slot>
              <p v-if="content">{{ content }}</p>
            </slot>
          </main>

          <footer v-if="showFooter || $slots.footer" class="modal-footer" :style="footerStyles">
            <slot name="footer">
              <div class="modal-actions">
                <VButton
                  v-if="showCancelButton"
                  @click="cancel"
                  class="modal-btn modal-btn-cancel"
                  :disabled="loading"
                  :text="cancelText"
                  size="small"
                />
                <VButton
                  v-if="showConfirmButton"
                  @click="confirm"
                  class="modal-btn modal-btn-confirm"
                  :disabled="loading"
                  :text="confirmText"
                  :class="{ 'modal-btn-loading': loading }"
                  size="small"
                />
              </div>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import './VModal.css'
import { computed, watch, nextTick } from 'vue'
import VButton from '../Button/VButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  escapeToClose: {
    type: Boolean,
    default: true,
  },
  clickOutsideToClose: {
    type: Boolean,
    default: true,
  },

  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'extra-large', 'full'].includes(value),
  },
  centered: {
    type: Boolean,
    default: true,
  },

  showHeader: {
    type: Boolean,
    default: true,
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  closeAriaLabel: {
    type: String,
    default: 'Fechar',
  },

  showFooter: {
    type: Boolean,
    default: false,
  },
  showCancelButton: {
    type: Boolean,
    default: true,
  },
  showConfirmButton: {
    type: Boolean,
    default: true,
  },
  cancelText: {
    type: String,
    default: 'Cancelar',
  },
  confirmText: {
    type: String,
    default: 'Confirmar',
  },

  loading: {
    type: Boolean,
    default: false,
  },

  customClass: {
    type: String,
    default: '',
  },
  overlayColor: {
    type: String,
    default: 'rgba(0, 0, 0, 0.5)',
  },
  backgroundColor: {
    type: String,
    default: 'var(--white-color)',
  },
  borderRadius: {
    type: String,
    default: '8px',
  },
  maxWidth: {
    type: String,
    default: '',
  },
  maxHeight: {
    type: String,
    default: '90vh',
  },

  zIndex: {
    type: Number,
    default: 1000,
  },
})

const emit = defineEmits(['update:modelValue', 'close', 'cancel', 'confirm', 'opened', 'closed'])
const overlayStyles = computed(() => ({
  backgroundColor: props.overlayColor,
  zIndex: props.zIndex,
}))

const containerStyles = computed(() => ({
  backgroundColor: props.backgroundColor,
  borderRadius: props.borderRadius,
  maxWidth: props.maxWidth || undefined,
  maxHeight: props.maxHeight,
}))

const headerStyles = computed(() => ({}))
const bodyStyles = computed(() => ({}))
const footerStyles = computed(() => ({}))

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const cancel = () => {
  emit('cancel')
  if (!props.persistent) {
    close()
  }
}

const confirm = () => {
  emit('confirm')
}

const handleOverlayClick = () => {
  if (props.clickOutsideToClose && !props.persistent) {
    close()
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.escapeToClose && !props.persistent) {
    close()
  }
}

watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal) {
      await nextTick()
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      emit('opened')
    } else {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      emit('closed')
    }
  },
)

import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>
