<template>
  <div id="app" :style="{ gridTemplateColumns: gridColumns, gridTemplateAreas: gridAreas }">
    <div v-if="isInitializing" class="app-loading">
      <div class="loading-container">
        <div class="logo-animation">
          <img src="/icon/favicon.png" alt="logo" />
        </div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <p class="loading-text">Carregando sistema...</p>
        </div>
        <div class="construction-icons">
          <div class="icon-float icon-1">
            <FontAwesomeIcon icon="house" />
          </div>
          <div class="icon-float icon-2">
            <FontAwesomeIcon icon="hammer" />
          </div>
          <div class="icon-float icon-3">
            <FontAwesomeIcon icon="ruler" />
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <VSidebar v-if="showSidebar" class="sidebar" @collapsed-changed="handleSidebarCollapsed" />

      <div v-if="showSidebar" class="main-content">
        <VNav
          class="navbar"
          :is-collapsed="isCollapsed"
          :user="currentUser"
          :notifications="notifications"
          :unread-count="unreadNotificationsCount"
          @search="handleSearch"
          @profile-action="handleProfileAction"
          @notification-click="handleNotificationClick"
          @logout="handleLogout"
        />
        <RouterView class="content" />
      </div>

      <RouterView v-else class="content-full" />
    </template>

    <!-- Modal de confirmação global -->
    <teleport to="body">
      <div v-if="showConfirmModal" class="modal-overlay" @click="cancelConfirm">
        <div class="confirm-modal" @click.stop>
          <div class="confirm-header">
            <h3>{{ confirmData.title }}</h3>
          </div>
          <div class="confirm-body">
            <p>{{ confirmData.message }}</p>
          </div>
          <div class="confirm-actions">
            <VButton text="Cancelar" variant="secondary" @click="cancelConfirm" />
            <VButton
              :text="confirmData.confirmText || 'Confirmar'"
              :variant="confirmData.variant || 'danger'"
              @click="confirmAction"
            />
          </div>
        </div>
      </div>
    </teleport>

    <!-- Overlay de desconexão -->
    <div v-if="showOfflineMessage" class="offline-overlay">
      <div class="offline-content">
        <i class="fas fa-wifi-slash"></i>
        <h3>Sem conexão</h3>
        <p>Verifique sua conexão com a internet</p>
        <VButton text="Tentar novamente" variant="primary" @click="checkConnection" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useAuth, useNotifications } from '@/hooks/useAuth'
import VSidebar from './components/Sidebar/VSidebar.vue'
import VNav from './components/Nav/VNav.vue'
import VButton from './components/Button/VButton.vue'
import VPopup from './components/Popup/VPopup.vue'

const authStore = useAuthStore()
const { isAuthenticated, user: currentUser, logout } = useAuth()
const {
  notifications,
  unreadCount: unreadNotificationsCount,
  loadNotifications,
} = useNotifications()

const route = useRoute()

const sidebarWidth = ref(250)
const isCollapsed = ref(false)
const isInitializing = ref(true)
const popups = ref([])
const showConfirmModal = ref(false)
const confirmData = ref({})
const confirmCallback = ref(null)
const showOfflineMessage = ref(false)

const showSidebar = computed(() => {
  return isAuthenticated.value && route.name !== 'home' && route.name !== 'microsoft-callback'
})

const gridColumns = computed(() => {
  if (!showSidebar.value) return '1fr'
  return `${sidebarWidth.value}px 1fr`
})

const gridAreas = computed(() => {
  if (!showSidebar.value) return "'content'"
  return "'sidebar main'"
})

// Métodos
function handleSidebarCollapsed(collapsed) {
  isCollapsed.value = collapsed
  sidebarWidth.value = collapsed ? 80 : 250
}

function handleSearch(searchQuery) {
  console.log('Pesquisando:', searchQuery)
  showPopup('warning', 'Pesquisa', `Pesquisando por: ${searchQuery}`)
}

async function handleProfileAction(action) {
  console.log('Ação do perfil:', action)

  if (action === 'logout') {
    await handleLogout()
  } else if (action === 'edit') {
    console.log('Editando perfil...')
  } else if (action === 'settings') {
    console.log('Abrindo configurações...')
  }
}

function handleNotificationClick(notification) {
  console.log('Notificação clicada:', notification)
  if (!notification.lida) {
    // markAsRead será chamado automaticamente pelo componente
  }
}

async function handleLogout() {
  const confirmed = await showConfirm(
    'Confirmar Logout',
    'Tem certeza que deseja sair do sistema?',
    'Sair',
    'danger',
  )

  if (confirmed) {
    try {
      await logout()
      showPopup('success', 'Logout realizado', 'Você foi desconectado com sucesso')
    } catch (error) {
      showPopup('danger', 'Erro ao fazer logout', 'Ocorreu um erro ao tentar desconectar')
    }
  }
}

// Sistema de Popup usando VPopup
let popupId = 0

function showPopup(mark, msg, content = '', autoClose = 5000) {
  const popup = {
    id: ++popupId,
    mark, // 'success', 'danger', 'warning'
    msg,
    content,
    visible: true,
    autoClose,
  }

  popups.value.push(popup)
  return popup.id
}

function updatePopupVisibility(id, visible) {
  const popup = popups.value.find((p) => p.id === id)
  if (popup) {
    popup.visible = visible
    if (!visible) {
      // Remove após a transição
      setTimeout(() => removePopup(id), 300)
    }
  }
}

function removePopup(id) {
  const index = popups.value.findIndex((popup) => popup.id === id)
  if (index > -1) {
    popups.value.splice(index, 1)
  }
}

// Sistema de Modal de Confirmação
function showConfirm(title, message, confirmText = 'Confirmar', variant = 'primary') {
  return new Promise((resolve) => {
    confirmData.value = {
      title,
      message,
      confirmText,
      variant,
    }

    confirmCallback.value = resolve
    showConfirmModal.value = true
  })
}

function confirmAction() {
  if (confirmCallback.value) {
    confirmCallback.value(true)
  }
  showConfirmModal.value = false
  confirmCallback.value = null
}

function cancelConfirm() {
  if (confirmCallback.value) {
    confirmCallback.value(false)
  }
  showConfirmModal.value = false
  confirmCallback.value = null
}

// Verificação de conexão
function checkConnection() {
  if (navigator.onLine) {
    showOfflineMessage.value = false
    showPopup('success', 'Conexão restaurada', 'Você está online novamente')
  } else {
    showPopup('danger', 'Ainda sem conexão', 'Verifique sua rede')
  }
}

function handleOnline() {
  showOfflineMessage.value = false
  showPopup('success', 'Conexão restaurada', 'Você está online')
}

function handleOffline() {
  showOfflineMessage.value = true
  showPopup('warning', 'Conexão perdida', 'Você está offline')
}

// Inicialização
async function initializeApp() {
  try {
    isInitializing.value = true

    await authStore.initializeAuth()

    if (isAuthenticated.value) {
      try {
        await loadNotifications()
      } catch (error) {
        console.warn('Erro ao carregar notificações iniciais:', error)
        showPopup('warning', 'Aviso', 'Não foi possível carregar algumas notificações')
      }
    }
  } catch (error) {
    console.error('Erro na inicialização:', error)
    showPopup('danger', 'Erro na inicialização', 'Ocorreu um erro ao inicializar a aplicação')
  } finally {
    isInitializing.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await initializeApp()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  if (!navigator.onLine) {
    showOfflineMessage.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

// Expor métodos globalmente para outros componentes
window.showPopup = showPopup
window.showConfirm = showConfirm
</script>

<style scoped>
#app {
  display: grid;
  width: 100%;
  height: 100vh;
  gap: 0;
  position: relative;
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
  padding: 0;
  overflow-y: auto;
  background: #f8fafc;
}

/* Loading inicial */
.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #2b2522 0%, #1a1614 50%, #2b2522 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
}

.loading-container {
  text-align: center;
  color: white;
  position: relative;
  z-index: 2;
}

.logo-animation {
  margin-bottom: 3rem;
  position: relative;
  animation: logo 1s infinite;
}

@keyframes logo {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-progress {
  margin: 3rem 0;
  width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #bc1f1b 0%, #d63031 50%, #e74c3c 100%);
  border-radius: 10px;
  width: 0%;
  animation: progressLoad 3s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(188, 31, 27, 0.6);
}

@keyframes progressLoad {
  0% {
    width: 0%;
  }
  70% {
    width: 100%;
  }
  100% {
    width: 100%;
  }
}

.loading-text {
  margin: 1.5rem 0 0 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
  animation: textPulse 2s ease-in-out infinite;
}

@keyframes textPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.construction-icons {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.icon-float {
  position: absolute;
  font-size: 2rem;
  opacity: 0.1;
  animation: iconFloat 8s ease-in-out infinite;
}

.icon-1 {
  top: 20%;
  left: 15%;
  animation-delay: 0s;
}

.icon-2 {
  top: 60%;
  right: 20%;
  animation-delay: 2s;
}

.icon-3 {
  bottom: 25%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 0.15;
  }
  75% {
    transform: translateY(-30px) rotate(-5deg);
    opacity: 0.25;
  }
}

.app-loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(188, 31, 27, 0.3), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(188, 31, 27, 0.2), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.1), transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.05), transparent);
  background-size: 200px 200px;
  animation: particleMove 20s linear infinite;
  z-index: 1;
}

@keyframes particleMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(-200px, -200px);
  }
}

/* Container de Popups */
.popup-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 450px;
  pointer-events: none;
}

.popup-container > * {
  pointer-events: all;
}

/* Transições para VPopup */
.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.popup-slide-enter-from {
  opacity: 0;
  transform: translateX(400px) scale(0.8);
}

.popup-slide-leave-to {
  opacity: 0;
  transform: translateX(400px) scale(0.8);
}

.popup-slide-move {
  transition: transform 0.4s ease;
}

/* Modal de confirmação */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.confirm-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  overflow: hidden;
}

.confirm-header {
  padding: 1.5rem 1.5rem 0;
}

.confirm-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.confirm-body {
  padding: 1rem 1.5rem;
}

.confirm-body p {
  margin: 0;
  color: #6c757d;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 1rem;
  padding: 0 1.5rem 1.5rem;
  justify-content: flex-end;
}

/* Overlay offline */
.offline-overlay {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
  background: rgba(220, 53, 69, 0.95);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
  z-index: 1500;
  text-align: center;
}

.offline-content {
  max-width: 300px;
  margin: 0 auto;
}

.offline-content i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.offline-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.offline-content p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

/* Responsividade */
@media (max-width: 1024px) {
  .content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 0.75rem;
  }

  .popup-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }

  .offline-overlay {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .confirm-modal {
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .confirm-actions {
    flex-direction: column;
  }

  .loading-progress {
    width: 200px;
  }

  .icon-float {
    font-size: 1.5rem;
  }
}
</style>
