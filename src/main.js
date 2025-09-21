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
  faMagnifyingGlass, // search
  faUser, // user
  faArrowRightFromBracket, // sign-out-alt
  faHome,
  faChevronRight,
  faBell,
  faUserCircle,
  faTimes,
  faEdit,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faPuzzlePiece, // <-- adicionamos aqui
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
  faBell,
  faUserCircle,
  faTimes,
  faEdit,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faPuzzlePiece, // <-- adicionamos aqui também
)

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
