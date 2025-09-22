<template>
  <aside :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-backdrop" v-if="isMobileMenuOpen" @click="closeMobileMenu"></div>
    <div class="sidebar-content">
      <sidebar-header
        :is-collapsed="isCollapsed"
        @item-click="toggleSidebar"
        @mobile-menu="toggleMobileMenu"
      />
      <div class="sidebar-divider"></div>
      <sidebar-menu :is-collapsed="isCollapsed" :menuItems="menu" />
    </div>
  </aside>
</template>

<script>
import './css/VSidebar.css'
import SidebarHeader from './components/SidebarHeader.vue'
import SidebarMenu from './components/SidebarMenu.vue'

export default {
  components: { SidebarHeader, SidebarMenu },
  emits: ['collapsed-changed'],
  data() {
    return {
      isCollapsed: false,
      isMobileMenuOpen: false,
      menu: [
        {
          name: 'Dashboard',
          description: "KPI's de gestão",
          link: '/main',
          icon: ['fas', 'chart-pie'],
        },
        {
          name: 'Auditoria',
          description: 'Gestão de Informações',
          link: '/auditlog',
          icon: ['fas', 'magnifying-glass'],
        },
        {
          name: 'Usuários',
          description: 'Informações de Usuários',
          link: '/users',
          icon: ['fas', 'users'],
        },
        {
          name: 'Dependências',
          description: 'Relacione as dependencias das tabelas',
          link: '/dependencias',
          icon: ['fas', 'puzzle-piece'],
        },
      ],
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
      this.$emit('collapsed-changed', this.isCollapsed)
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false
    },
  },
  mounted() {
    const mediaQuery = window.matchMedia('(max-width: 1024px)')
    this.isCollapsed = mediaQuery.matches

    mediaQuery.addListener((e) => {
      if (e.matches) {
        this.isCollapsed = true
      }
    })
  },
}
</script>
