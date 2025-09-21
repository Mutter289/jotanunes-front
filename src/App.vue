<template>
  <div id="app" :style="{ gridTemplateColumns: gridColumns, gridTemplateAreas: gridAreas }">
    <VSidebar v-if="showSidebar" class="sidebar" @collapsed-changed="handleSidebarCollapsed" />
    <div v-if="showSidebar" class="main-content">
      <VNav
        class="navbar"
        :is-collapsed="isCollapsed"
        @search="handleSearch"
        @profile-action="handleProfileAction"
        @notification-click="handleNotificationClick"
      />
      <RouterView class="content" />
    </div>
    <RouterView v-else class="content-full" />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import VSidebar from './components/Sidebar/VSidebar.vue'
import VNav from './components/Nav/VNav.vue'

const route = useRoute()
const sidebarWidth = ref(250)
const isCollapsed = ref(false)

const showSidebar = computed(() => route.name !== 'home')

const gridColumns = computed(() => {
  if (!showSidebar.value) return '1fr'
  return `${sidebarWidth.value}px 1fr`
})

const gridAreas = computed(() => {
  if (!showSidebar.value) return "'content'"
  return "'sidebar main'"
})

function handleSidebarCollapsed(collapsed) {
  isCollapsed.value = collapsed
  sidebarWidth.value = collapsed ? 80 : 250
}

function handleSearch(searchQuery) {
  console.log('Pesquisando:', searchQuery)
  // Implementar lógica de pesquisa aqui
}

function handleProfileAction(action) {
  console.log('Ação do perfil:', action)
  if (action === 'logout') {
    // Implementar logout
    console.log('Fazendo logout...')
  } else if (action === 'edit') {
    // Navegar para página de edição de perfil
    console.log('Editando perfil...')
  }
}

function handleNotificationClick(notification) {
  console.log('Notificação clicada:', notification)
  // Implementar ação da notificação
}
</script>

<style scoped>
#app {
  display: grid;
  width: 100%;
  height: 100vh;
  gap: 0;
}

.sidebar {
  grid-area: sidebar;
}

.main-content {
  grid-area: main;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.navbar {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: #f8fafc;
}

.content-full {
  grid-area: content;
  padding: 2rem;
  overflow-y: auto;
  background: #f8fafc;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .content,
  .content-full {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .content,
  .content-full {
    padding: 0.75rem;
  }
}
</style>
