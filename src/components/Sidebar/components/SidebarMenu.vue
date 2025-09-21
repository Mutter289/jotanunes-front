<template>
  <nav class="menu-container" :class="{ 'menu-collapsed': isCollapsed }">
    <div class="menu-scroll">
      <div class="menu-group">
        <h3 v-if="!isCollapsed" class="menu-group-title">Especialidades</h3>

        <div class="menu-items">
          <router-link
            v-for="(item, idx) in menuItems"
            :key="idx"
            :to="item.link"
            class="menu-item"
            :class="{ 'menu-item-active': isActiveRoute(item.link) }"
            @click="handleItemClick(item)"
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
                <div v-if="item.badge" class="menu-badge">{{ item.badge }}</div>
              </div>

              <transition name="menu-text">
                <div v-if="!isCollapsed" class="menu-text-wrapper">
                  <span class="menu-text">{{ item.name }}</span>
                  <span v-if="item.description" class="menu-description">
                    {{ item.description }}
                  </span>
                </div>
              </transition>
            </div>

            <div v-if="isCollapsed" class="menu-tooltip">
              {{ item.name }}
              <div class="tooltip-arrow"></div>
            </div>
          </router-link>
        </div>
      </div>

      <div v-if="!isCollapsed" class="menu-group">
        <h3 class="menu-group-title">Ferramentas</h3>
        <div class="menu-items">
          <div class="menu-item menu-item-disabled">
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <FontAwesomeIcon icon="chart-line" class="menu-icon" />
              </div>
              <div class="menu-text-wrapper">
                <span class="menu-text">Relatórios</span>
                <span class="menu-description">Em breve</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import '../css/SidebarMenu.css'

export default {
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    menuItems: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
    handleItemClick(item) {
      this.$emit('item-selected', item)
    },
    isActiveRoute(route) {
      return this.$route?.path === route
    },
  },
}
</script>
