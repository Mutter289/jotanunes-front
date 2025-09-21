<template>
  <button
    @click="!disabled && $emit('click', $event)"
    :type="type"
    :class="['btn', `btn-${variant}`, `btn-${size}`, { 'btn-disabled': disabled }]"
  >
    <!-- Se não passar slot, usa a prop text -->
    <slot>
      {{ text }}
    </slot>
  </button>
</template>

<script>
import './VButton.css'

export default {
  name: 'VButton',
  props: {
    text: {
      type: String,
      default: '',
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value),
    },
    type: {
      type: String,
      default: 'button',
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) =>
        ['default', 'primary', 'secondary', 'ghost', 'danger', 'add'].includes(value),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
}
</script>
