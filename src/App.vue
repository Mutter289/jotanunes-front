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

    <!-- Notificações Toast -->
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]">
          <div class="toast-icon">
            <i :class="getToastIcon(toast.type)"></i>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click="removeToast(toast.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </transition-group>
    </div>

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
const toasts = ref([])
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

// Watchers
watch(isAuthenticated, async (newValue) => {
  if (newValue) {
    // Carregar notificações quando usuário faz login
    try {
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }
})

// Métodos
function handleSidebarCollapsed(collapsed) {
  isCollapsed.value = collapsed
  sidebarWidth.value = collapsed ? 80 : 250
}

function handleSearch(searchQuery) {
  console.log('Pesquisando:', searchQuery)
  // Implementar lógica de pesquisa global
  showToast('info', 'Pesquisa', `Pesquisando por: ${searchQuery}`)
}

async function handleProfileAction(action) {
  console.log('Ação do perfil:', action)

  if (action === 'logout') {
    await handleLogout()
  } else if (action === 'edit') {
    // Navegar para página de edição de perfil
    console.log('Editando perfil...')
  } else if (action === 'settings') {
    console.log('Abrindo configurações...')
  }
}

function handleNotificationClick(notification) {
  console.log('Notificação clicada:', notification)
  // Implementar ação da notificação
  // Marcar como lida se não foi lida
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
      showToast('success', 'Logout', 'Você foi desconectado com sucesso')
    } catch (error) {
      showToast('error', 'Erro', 'Erro ao fazer logout')
    }
  }
}

// Sistema de Toast
let toastId = 0

function showToast(type, title, message, duration = 5000) {
  const toast = {
    id: ++toastId,
    type,
    title,
    message,
    duration,
  }

  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast.id)
    }, duration)
  }

  return toast.id
}

function removeToast(id) {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function getToastIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
  }
  return icons[type] || 'fas fa-bell'
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
    showToast('success', 'Conexão', 'Conexão restaurada')
  } else {
    showToast('error', 'Offline', 'Ainda sem conexão')
  }
}

function handleOnline() {
  showOfflineMessage.value = false
  showToast('success', 'Online', 'Conexão restaurada')
}

function handleOffline() {
  showOfflineMessage.value = true
  showToast('warning', 'Offline', 'Conexão perdida')
}

// Inicialização
async function initializeApp() {
  try {
    isInitializing.value = true

    // Inicializar autenticação
    await authStore.initializeAuth()

    // Se está autenticado, carregar dados necessários
    if (isAuthenticated.value) {
      try {
        await loadNotifications()
      } catch (error) {
        console.warn('Erro ao carregar notificações iniciais:', error)
      }
    }
  } catch (error) {
    console.error('Erro na inicialização:', error)
    showToast('error', 'Erro', 'Erro ao inicializar aplicação')
  } finally {
    isInitializing.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await initializeApp()

  // Event listeners para conexão
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Verificar conexão inicial
  if (!navigator.onLine) {
    showOfflineMessage.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

// Expor métodos globalmente para outros componentes
window.showToast = showToast
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

/* Animação do Logo */
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

.logo-parts {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 2rem;
  height: 80px;
  position: relative;
}

.beam {
  width: 12px;
  background: linear-gradient(180deg, #bc1f1b 0%, #d63031 50%, #bc1f1b 100%);
  margin: 0 3px;
  border-radius: 2px;
  transform-origin: bottom;
  box-shadow: 0 0 20px rgba(188, 31, 27, 0.5);
}

.beam-1 {
  height: 40px;
  animation: beamGrow1 2s ease-in-out infinite;
}

.beam-2 {
  height: 60px;
  animation: beamGrow2 2s ease-in-out infinite 0.3s;
}

.beam-3 {
  height: 80px;
  animation: beamGrow3 2s ease-in-out infinite 0.6s;
}

@keyframes beamGrow1 {
  0%,
  100% {
    transform: scaleY(0.6);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes beamGrow2 {
  0%,
  100% {
    transform: scaleY(0.7);
    opacity: 0.8;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes beamGrow3 {
  0%,
  100% {
    transform: scaleY(0.8);
    opacity: 0.9;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.logo-text h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #bc1f1b 0%, #d63031 50%, #bc1f1b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGlow 3s ease-in-out infinite;
  letter-spacing: -2px;
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 8px;
  opacity: 0.9;
  animation: subtitleFade 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 10px rgba(188, 31, 27, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(188, 31, 27, 0.6));
  }
}

@keyframes subtitleFade {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* Barra de progresso */
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

/* Ícones flutuantes de construção */
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

/* Efeito de partículas no fundo */
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

/* Responsividade */
@media (max-width: 768px) {
  .logo-text h1 {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1rem;
    letter-spacing: 4px;
  }

  .loading-progress {
    width: 250px;
  }

  .beam {
    width: 10px;
    margin: 0 2px;
  }

  .beam-1 {
    height: 30px;
  }
  .beam-2 {
    height: 45px;
  }
  .beam-3 {
    height: 60px;
  }
}

@media (max-width: 480px) {
  .logo-text h1 {
    font-size: 2rem;
  }

  .loading-progress {
    width: 200px;
  }

  .icon-float {
    font-size: 1.5rem;
  }
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  min-width: 300px;
}

.toast-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.toast-error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.toast-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #212529;
}

.toast-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

.toast-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.toast-message {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
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

/* Responsive adjustments */
@media (max-width: 1024px) {
  .content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 0.75rem;
  }

  .toast-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }

  .toast {
    min-width: auto;
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
}
</style>
