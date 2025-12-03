<template>
  <div class="header-wrapper">
    <div class="sidebar-header" :class="{ 'header-collapsed': isCollapsed }">
      <div class="logo-container">
        <transition name="logo-fade" mode="out-in">
          <img
            v-if="!isCollapsed"
            src="/logo/logo-jotanunes-branca.svg"
            alt="Logo da aplicação"
            class="logo-full"
            key="full-logo"
          />
          <div v-else class="logo-mini" key="mini-logo">
            <img src="/icon/favicon.png" alt="Logo mini" />
          </div>
        </transition>
      </div>

      <div class="header-actions">
        <VButton
          @click="$emit('item-click')"
          customClass="toggle-btn"
          variant="primary"
          style="background-color: rgba(0, 0, 0, 0.75); border: none"
        >
          <FontAwesomeIcon
            icon="caret-left"
            :class="{ 'icon-rotated': isCollapsed }"
            style="color: #fff"
          />
        </VButton>
      </div>
    </div>

    <div v-if="!isCollapsed" class="section-title">
      <h2>Sentinela</h2>
      <p>Painel Administrativo</p>
    </div>
  </div>
</template>

<script>
import '../css/SidebarHeader.css'
import VButton from '@/components/Button/VButton.vue'

export default {
  components: { VButton },
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['item-click', 'mobile-menu'],
}
</script>
