import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
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
  faEye,
  faEyeSlash,
  faLock,
  faUnlock,
  faShieldHalved,
  faCrown,
  faUserShield,
  faHammer,
  faRuler,
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
  faUserClock,
  faDatabase,
} from '@fortawesome/free-solid-svg-icons'
library.add(
  faCaretLeft,
  faChartPie,
  faUsers,
  faMagnifyingGlass,
  faUser,
  faArrowRightFromBracket,
  faHome,
  faChevronRight,
  faHammer,
  faRuler,
  faBell,
  faUserCircle,
  faXmark,
  faEdit,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faPuzzlePiece,
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
  faUserClock,
  faDatabase,
)

const pinia = createPinia()

const app = createApp(App)

app.component('FontAwesome', FontAwesomeIcon)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.use(pinia)
app.use(router)

if (import.meta.env.DEV) {
  app.config.globalProperties.$log = console.log
  console.log('Aplicação iniciada em modo de desenvolvimento')
  console.log('Sistema de Auditoria com Autenticação v3.0')
}
app.config.globalProperties.$showToast = window.showToast || (() => {})
app.config.globalProperties.$showConfirm = window.showConfirm || (() => Promise.resolve(false))

if (typeof window !== 'undefined') {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.195.162:8000' //http://192.168.0.7:8000
  window.API_BASE_URL = API_BASE_URL

  if (import.meta.env.DEV) {
    console.log('API Base URL:', API_BASE_URL)
  }
}
app.config.errorHandler = (err, vm, info) => {
  console.error('Erro global capturado:', err, info)

  if (import.meta.env.PROD && window.showToast) {
    window.showToast('error', 'Erro', 'Ocorreu um erro inesperado')
  }
}

app.mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

if (import.meta.env.DEV) {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', entry.loadEventEnd - entry.fetchStart, 'ms')
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
}

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

export { pinia, router }
