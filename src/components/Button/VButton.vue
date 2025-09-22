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

<style scoped>
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.4;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  user-select: none;
}

.btn:focus-visible {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  min-height: 32px;
  gap: 0.3rem;
}

.btn-medium {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  min-height: 40px;
  gap: 0.5rem;
}

.btn-large {
  padding: 1rem 1.5rem;
  font-size: 1rem;
  min-height: 48px;
  gap: 0.75rem;
}

.btn-default {
  background: var(--white-color);
  color: var(--secundary-color);
  border: 1px solid var(--grey-color);
  transform: translateY(-1px);
  box-shadow: var(--box-shadow);
}

.btn-default:hover:not(.btn-disabled) {
  background: var(--grey-color);
  color: var(--secundary-color);
  transform: translateY(-1px);
  box-shadow: var(--box-shadow);
}

.btn-primary {
  background: var(--theme-color);
  color: var(--white-color);
  border: 1px solid var(--theme-color);
  transition: 0.3s ease;
}

.btn-primary:hover:not(.btn-disabled) {
  background: var(--theme-color);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--theme-color-hover);
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.1);
  color: var(--grey-dark);
  border: 1px solid var(--grey-light);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover:not(.btn-disabled) {
  background: rgba(107, 114, 128, 0.15);
  border-color: var(--grey-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.2);
}

.btn-danger {
  background: var(--theme-color);
  color: var(--white-color);
  border: 1px solid var(--theme-color);
}

.btn-danger:hover:not(.btn-disabled) {
  background: #a01a17; /* Tom mais escuro do theme-color */
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--theme-color-hover);
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white-color);
  background: var(--badge-gradient);
  box-shadow: var(--box-shadow);
  font-size: 12px;
}

.btn-add:hover:not(.btn-disabled) {
  background: var(--badge-gradient);
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: var(--box-shadow);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
