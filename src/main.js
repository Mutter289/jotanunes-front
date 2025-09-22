import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faCaretLeft,
  faChartPie,
  faUsers,
  faMagnifyingGlass,
  faUser,
  faArrowRightFromBracket, // Antigo faSignOutAlt
  faHome,
  faChevronRight,
  faBell,
  faUserCircle,
  faXmark, // Antigo faTimes
  faEdit,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faPuzzlePiece,
  // Ícones adicionais para autenticação
  faEye,
  faEyeSlash,
  faLock,
  faUnlock,
  faShieldHalved, // Antigo faShieldAlt
  faCrown,
  faUserShield,
  faRightToBracket, // Antigo faSignInAlt
  faUserPlus,
  faUserCheck,
  faUserTimes,
  faEnvelope,
  faKey,
  faSpinner,
  faExclamationCircle,
  faWifi,
  // faWifiSlash foi removido (é um ícone Pro)
  faSync,
  faCog,
  faChevronDown,
  faChevronUp,
  faEllipsisV,
  faTrash,
  faDownload,
  faLink,
  faCheck,
  faBan,
  faHourglassHalf,
  faUserClock
} from '@fortawesome/free-solid-svg-icons'

// Adicionar ícones à biblioteca
library.add(
  faCaretLeft,
  faChartPie,
  faUsers,
  faMagnifyingGlass,
  faUser,
  faArrowRightFromBracket,
  faHome,
  faChevronRight,
  faBell,
  faUserCircle,
  faXmark,
  faEdit,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faPuzzlePiece,
  // Ícones de autenticação
  faEye,
  faEyeSlash,
  faLock,
  faUnlock,
  faShieldHalved,
  faCrown,
  faUserShield,
  faRightToBracket,
  faUserPlus,
  faUserCheck,
  faUserTimes,
  faEnvelope,
  faKey,
  faSpinner,
  faExclamationCircle,
  faWifi,
  faSync,
  faCog,
  faChevronDown,
  faChevronUp,
  faEllipsisV,
  faTrash,
  faDownload,
  faLink,
  faCheck,
  faBan,
  faHourglassHalf,
  faUserClock
)

// Criar instância do Pinia
const pinia = createPinia()

// Criar aplicação Vue
const app = createApp(App)

// Registrar componente FontAwesome
app.component('FontAwesome', FontAwesomeIcon)
app.component('FontAwesomeIcon', FontAwesomeIcon) // Manter compatibilidade

// Configurar plugins
app.use(pinia)
app.use(router)

// Configurações globais para desenvolvimento
if (import.meta.env.DEV) {
  app.config.globalProperties.$log = console.log
  console.log('🚀 Aplicação iniciada em modo de desenvolvimento')
  console.log('📊 Sistema de Auditoria com Autenticação v3.0')
}

// Configurar métodos globais (serão definidos no App.vue)
app.config.globalProperties.$showToast = window.showToast || (() => {})
app.config.globalProperties.$showConfirm = window.showConfirm || (() => Promise.resolve(false))

// Configurar axios defaults (se necessário)
if (typeof window !== 'undefined') {
  // Configurar base URL do axios
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.7:8000'
  window.API_BASE_URL = API_BASE_URL
  
  // Log da configuração
  if (import.meta.env.DEV) {
    console.log('🔗 API Base URL:', API_BASE_URL)
  }
}

// Manipulador de erros globais
app.config.errorHandler = (err, vm, info) => {
  console.error('Erro global capturado:', err, info)
  
  // Em produção, você pode enviar erros para um serviço de monitoramento
  if (import.meta.env.PROD && window.showToast) {
    window.showToast('error', 'Erro', 'Ocorreu um erro inesperado')
  }
}

// Mount da aplicação
app.mount('#app')

// Service Worker (opcional, para PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Configurações de performance
if (import.meta.env.DEV) {
  // Performance observer para desenvolvimento
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('📈 Navigation timing:', entry.loadEventEnd - entry.fetchStart, 'ms')
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
}

// Tratamento de eventos de conectividade
window.addEventListener('online', () => {
  if (window.showToast) {
    window.showToast('success', 'Online', 'Conexão restaurada')
  }
})

window.addEventListener('offline', () => {
  if (window.showToast) {
    window.showToast('warning', 'Offline', 'Você está offline')
  }
})

// Exportar algumas configurações para uso em outros módulos
export { pinia, router }