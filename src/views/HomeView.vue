<template>
  <div class="login-bg">
    <div class="login-container" :class="{ loading: isLoading }">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Autenticando...</p>
      </div>

      <div class="image-content">
        <div class="image-overlay">
          <div class="floating-elements">
            <div class="floating-circle circle-1"></div>
            <div class="floating-circle circle-2"></div>
            <div class="floating-circle circle-3"></div>
          </div>
        </div>
      </div>

      <div class="form-container">
        <div class="form-nav">
          <!-- Header -->
          <div class="form-header">
            <p class="welcome-text">{{ welcomeMessage }}</p>
            <h1 class="main-title">Acesse o portal</h1>
          </div>

          <!-- Form Content -->
          <form @submit.prevent="handleLogin" class="form-content" novalidate>
            <!-- Email Input -->
            <div class="input-group">
              <VInput
                v-model="userCredentials.username"
                placeholder="E-mail @jotanunes"
                label="Email *"
                type="email"
                :error="errors.username"
                :disabled="isLoading"
                custom-class="primary-input"
                required
                @blur="validateEmail"
                @input="clearError('username')"
              />
            </div>

            <!-- Password Input -->
            <div class="input-group">
              <VInput
                v-model="userCredentials.userPassword"
                :type="showPassword ? 'text' : 'password'"
                label="Senha *"
                placeholder="Senha"
                :error="errors.userPassword"
                :disabled="isLoading"
                custom-class="primary-input"
                required
                @blur="validatePassword"
                @input="clearError('userPassword')"
              >
                <template #suffix>
                  <button
                    type="button"
                    class="password-toggle"
                    @click="togglePassword"
                    :disabled="isLoading"
                    tabindex="-1"
                  >
                    <i :class="showPassword ? 'icon-eye-off' : 'icon-eye'"></i>
                  </button>
                </template>
              </VInput>
            </div>

            <!-- Remember Me -->
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="isLoading"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">Lembrar-me</span>
              </label>
            </div>

            <!-- Login Button -->
            <VButton
              text="Acessar"
              variant="add"
              type="submit"
              :loading="isLoading"
              class="login-button"
            />

            <div v-if="generalError" class="error-message">
              <i class="icon-alert"></i>
              <span>{{ generalError }}</span>
            </div>
          </form>

          <!-- Footer -->
          <div class="form-container-footer">
            <p>
              Solicite seu acesso.
              <a href="#" @click.prevent="requestAccess" class="access-link"> Clique aqui! </a>
            </p>
            <div class="version-info">
              <span>v{{ appVersion }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="showSuccessToast" class="success-toast">
        <i class="icon-check"></i>
        <span>Login realizado com sucesso!</span>
      </div>
    </Transition>
  </div>
</template>

<script>
import VInput from '@/components/Input/VInput.vue'
import VButton from '@/components/Button/VButton.vue'

export default {
  name: 'LoginPage',
  components: { VInput, VButton },

  data() {
    return {
      userCredentials: {
        username: '',
        userPassword: '',
      },
      errors: {
        username: '',
        userPassword: '',
      },
      isLoading: false,
      showPassword: false,
      rememberMe: false,
      generalError: '',
      showSuccessToast: false,
      appVersion: '1.0.0',
    }
  },

  computed: {
    welcomeMessage() {
      const hour = new Date().getHours()
      if (hour < 12) return 'Bom dia!'
      if (hour < 18) return 'Boa tarde!'
      return 'Boa noite!'
    },

    isFormValid() {
      return (
        this.userCredentials.username.length > 0 &&
        this.userCredentials.userPassword.length > 0 &&
        !this.errors.username &&
        !this.errors.userPassword
      )
    },
  },

  methods: {
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.userCredentials.username) {
        this.errors.username = 'Email é obrigatório'
      } else if (!emailRegex.test(this.userCredentials.username)) {
        this.errors.username = 'Email inválido'
      } else if (!this.userCredentials.username.includes('@jotanunes')) {
        this.errors.username = 'Use o email corporativo @jotanunes'
      } else {
        this.errors.username = ''
      }
    },

    validatePassword() {
      if (!this.userCredentials.userPassword) {
        this.errors.userPassword = 'Senha é obrigatória'
      } else if (this.userCredentials.userPassword.length < 6) {
        this.errors.userPassword = 'Senha deve ter pelo menos 6 caracteres'
      } else {
        this.errors.userPassword = ''
      }
    },

    clearError(field) {
      if (this.errors[field]) {
        this.errors[field] = ''
      }
      if (this.generalError) {
        this.generalError = ''
      }
    },

    togglePassword() {
      this.showPassword = !this.showPassword
    },

    async handleLogin() {
      this.$router.push('/main')
    },

    requestAccess() {
      alert('Funcionalidade de solicitação de acesso será implementada')
    },

    loadSavedCredentials() {
      if (localStorage.getItem('rememberMe') === 'true') {
        this.rememberMe = true
        this.userCredentials.username = localStorage.getItem('lastUsername') || ''
      }
    },

    handleKeyboard(event) {
      if (event.ctrlKey && event.key === 'Enter') {
        this.handleLogin()
      }
    },
  },

  mounted() {
    this.loadSavedCredentials()
    document.addEventListener('keydown', this.handleKeyboard)

    // Auto-hide success toast
    setTimeout(() => {
      if (this.showSuccessToast) {
        this.showSuccessToast = false
      }
    }, 3000)
  },

  unmounted() {
    document.removeEventListener('keydown', this.handleKeyboard)
  },
}
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, var(--grey-color) 0%, #e9ecef 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.login-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23000" opacity="0.02"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.login-container {
  background: rgba(247, 247, 247, 0.95);
  backdrop-filter: blur(20px);
  width: 100%;
  max-width: 75rem;
  min-height: 40rem;
  border-radius: 25px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 25px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-container.loading {
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--theme-color-rgb, 74, 144, 226), 0.2);
  border-top: 3px solid var(--theme-color, #4a90e2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.image-content {
  background-image: url('/login/g.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 50%;
  min-height: 40rem;
  border-top-left-radius: 25px;
  border-bottom-left-radius: 25px;
  position: relative;
  overflow: hidden;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.circle-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 30%;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 40%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.form-container {
  width: 50%;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 40rem;
  position: relative;
}

.form-nav {
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(15px);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.08),
    0 4px 15px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.5rem;
  min-height: 500px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--theme-color, #4a90e2) 0%,
    var(--secundary-color, #9c27b0) 50%,
    var(--theme-color, #4a90e2) 100%
  );
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.form-header {
  text-align: left;
  margin-bottom: 2rem;
}

.welcome-text {
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0;
  animation: slideInUp 0.6s ease forwards;
}

.main-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(
    135deg,
    var(--secundary-color, #9c27b0) 0%,
    var(--theme-color, #4a90e2) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  animation: slideInUp 0.6s ease 0.2s forwards;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.input-group {
  position: relative;
  opacity: 0;
  animation: slideInUp 0.6s ease 0.4s forwards;
}

.input-group:nth-child(2) {
  animation-delay: 0.5s;
}

.password-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #6c757d;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: var(--theme-color, #4a90e2);
}

.checkbox-group {
  opacity: 0;
  animation: slideInUp 0.6s ease 0.6s forwards;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
  background: white;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--theme-color, #4a90e2);
  border-color: var(--theme-color, #4a90e2);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.checkbox-text {
  font-size: 0.9rem;
  color: #6c757d;
}

.login-button {
  margin-top: 1rem;
  opacity: 0;
  animation: slideInUp 0.6s ease 0.7s forwards;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 8px;
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  opacity: 0;
  animation: slideInUp 0.3s ease forwards;
}

.form-container-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  opacity: 0;
  animation: slideInUp 0.6s ease 0.8s forwards;
}

.form-container-footer p {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
}

.access-link {
  color: var(--theme-color, #4a90e2);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.access-link:hover {
  color: var(--secundary-color, #9c27b0);
  text-decoration: underline;
}

.version-info {
  font-size: 0.8rem;
  color: #adb5bd;
  margin-top: 0.5rem;
}

.success-toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1001;
  font-weight: 500;
}

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
  transform: translateX(100%);
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    max-width: 100%;
    min-height: auto;
  }

  .image-content {
    width: 100%;
    height: 200px;
    min-height: 200px;
    border-radius: 25px 25px 0 0;
  }

  .form-container {
    width: 100%;
    min-height: auto;
    padding: 2rem 1.5rem;
  }

  .main-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .login-bg {
    padding: 0.5rem;
  }

  .form-container {
    padding: 1.5rem 1rem;
  }

  .main-title {
    font-size: 1.6rem;
  }

  .form-nav {
    padding: 2rem 1.5rem;
  }
}

@media (hover: hover) {
  .form-nav:hover {
    transform: translateY(-2px);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.12),
      0 8px 25px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}
</style>
