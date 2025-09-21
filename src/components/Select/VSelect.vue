<template>
  <div class="select-wrapper" ref="selectWrapper">
    <label :for="id" v-if="label">{{ label }}</label>
    <div
      class="select-container"
      :class="{
        'is-open': isOpen,
        'is-focused': isFocused,
        'is-disabled': disabled,
      }"
    >
      <select
        :id="id"
        :value="modelValue"
        @change="updateValue"
        :disabled="disabled"
        :required="required"
        tabindex="-1"
        style="position: absolute; opacity: 0; pointer-events: none"
        aria-hidden="true"
      >
        <option value="" v-if="placeholder">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
          :disabled="getOptionDisabled(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      <div
        class="select-display"
        :class="{ 'has-placeholder': !selectedOption }"
        @click="toggleDropdown"
        @keydown="handleKeydown"
        :tabindex="disabled ? -1 : 0"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="listbox"
        :aria-labelledby="label ? `${id}-label` : undefined"
      >
        <span class="select-value">
          {{ displayValue }}
        </span>
        <div class="select-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <Transition name="dropdown">
        <div
          v-if="isOpen"
          class="select-dropdown"
          role="listbox"
          :aria-labelledby="label ? `${id}-label` : undefined"
        >
          <div
            v-for="(option, index) in options"
            :key="getOptionValue(option)"
            class="select-option"
            :class="{
              'is-selected': getOptionValue(option) === modelValue,
              'is-disabled': getOptionDisabled(option),
              'is-highlighted': highlightedIndex === index,
            }"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
            role="option"
            :aria-selected="getOptionValue(option) === modelValue"
          >
            <span class="option-label">{{ getOptionLabel(option) }}</span>
            <svg
              v-if="getOptionValue(option) === modelValue"
              class="option-check"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M13.5 4.5L6 12L2.5 8.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div v-if="options.length === 0" class="select-empty">Nenhuma opção disponível</div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import './VSelect.css'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).substr(2, 9)}`,
  },
  placeholder: {
    type: String,
    default: 'Selecione uma opção...',
  },
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  optionLabel: {
    type: String,
    default: 'label',
  },
  optionValue: {
    type: String,
    default: 'value',
  },
  optionDisabled: {
    type: String,
    default: 'disabled',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur'])

const isOpen = ref(false)
const isFocused = ref(false)
const highlightedIndex = ref(-1)
const selectWrapper = ref(null)

const selectedOption = computed(() => {
  return props.options.find((option) => getOptionValue(option) === props.modelValue)
})

const displayValue = computed(() => {
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value)
  }
  return props.placeholder
})

const toggleDropdown = () => {
  if (props.disabled) return

  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const openDropdown = () => {
  isOpen.value = true
  isFocused.value = true
  highlightedIndex.value = props.options.findIndex(
    (option) => getOptionValue(option) === props.modelValue,
  )
  emit('focus')
}

const closeDropdown = () => {
  isOpen.value = false
  isFocused.value = false
  highlightedIndex.value = -1
  emit('blur')
}

const selectOption = (option) => {
  if (getOptionDisabled(option)) return

  const value = getOptionValue(option)
  emit('update:modelValue', value)
  emit('change', value)
  closeDropdown()
}

const updateValue = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('change', value)
}

const handleKeydown = (event) => {
  if (props.disabled) return

  switch (event.key) {
    case ' ':
    case 'Enter':
      event.preventDefault()
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(props.options[highlightedIndex.value])
      } else {
        toggleDropdown()
      }
      break
    case 'Escape':
      closeDropdown()
      break
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, props.options.length - 1)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      }
      break
  }
}

const handleClickOutside = (event) => {
  if (selectWrapper.value && !selectWrapper.value.contains(event.target)) {
    closeDropdown()
  }
}

const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.optionLabel] || option.label || option.name || option
}

const getOptionValue = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.optionValue] || option.value || option.id || option
}

const getOptionDisabled = (option) => {
  if (typeof option === 'object') {
    return option[props.optionDisabled] || option.disabled || false
  }
  return false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
