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

      <div class="menu-group">
        <h3 v-if="!isCollapsed" class="menu-group-title">Ferramentas</h3>

        <div class="menu-items">
          <div 
            class="menu-item"
            :class="{ 'menu-item-active': isActiveRoute('/gemini-analyses') }"
            @click="$router.push('/gemini-analyses')"
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="menu-icon">
                  <path
                    fill="#ffffff"
                    d="M544 269.8C529.2 279.6 512.2 287.5 494.5 293.8C447.5 310.6 
                      385.8 320 320 320C254.2 320 192.4 310.5 145.5 293.8C127.9 
                      287.5 110.8 279.6 96 269.8L96 352C96 396.2 196.3 432 320 
                      432C443.7 432 544 396.2 544 352L544 269.8zM544 192L544 
                      144C544 99.8 443.7 64 320 64C196.3 64 96 99.8 96 
                      144L96 192C96 236.2 196.3 272 320 272C443.7 272 544 
                      236.2 544 192zM494.5 453.8C447.6 470.5 385.9 480 320 
                      480C254.1 480 192.4 470.5 145.5 453.8C127.9 447.5 110.8 
                      439.6 96 429.8L96 496C96 540.2 196.3 576 320 576C443.7 
                      576 544 540.2 544 496L544 429.8C529.2 439.6 512.2 447.5 
                      494.5 453.8z"
                  />
                </svg>
              </div>

              <transition name="menu-text">
                <div v-if="!isCollapsed" class="menu-text-wrapper">
                  <span class="menu-text">Análises</span>
                  <span class="menu-description">Análises de SQL's</span>
                </div>
              </transition>
            </div>

            <div v-if="isCollapsed" class="menu-tooltip">
              Análises
              <div class="tooltip-arrow"></div>
            </div>
          </div>

          <div
            class="menu-item"
            :class="{ 'menu-item-active': isActiveRoute('/monitoring') }"
            @click="$router.push('/monitoring')"
          >
            <div class="menu-item-content">
              <div class="menu-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="menu-icon">
                  <path
                    fill="#ffffff"
                    d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4
                      256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288
                      432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8
                      109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5
                      36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0
                      24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288
                      480s-145.5-36.8-192.6-80.6C48.6 355.9 17.3 303.9 2.4 268.3c-3.3-7.9-3.3-16.7
                      0-24.6C17.3 208.1 48.6 156.1 95.4 112.6zM288 336c44.2 0 80-35.8
                      80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7
                      64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128
                      128 0 1 1 0 256 128 128 0 1 1 0-256z"
                  />
                </svg>
              </div>

              <transition name="menu-text">
                <div v-if="!isCollapsed" class="menu-text-wrapper">
                  <span class="menu-text">Monitoramento</span>
                  <span class="menu-description">Monitoramento de métricas das API's</span>
                </div>
              </transition>
            </div>

            <div v-if="isCollapsed" class="menu-tooltip">
              Monitoramento
              <div class="tooltip-arrow"></div>
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
