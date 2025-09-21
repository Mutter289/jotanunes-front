<template>
  <div class="input-wrapper">
    <label v-if="label">{{ label }}</label>
    <input
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
    />
  </div>
</template>

<script>
import './VInput.css'
export default {
  props: {
    modelValue: String,
    label: String,
    type: {
      type: String,
      default: 'text',
    },
    placeholder: String,
  },
  emits: ['update:modelValue', 'blur'],
}
</script>
