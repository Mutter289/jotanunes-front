<template>
  <div class="login-page">
    <div class="login-container" :class="{ loading: isLoading }">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <div class="login-form-section">
        <div class="login-header">
          <h1 class="login-title">
            <img src="/logo/Logo-Preta.png" alt="logo" width="auto" height="66px" />
          </h1>
          <p class="login-subtitle">
            {{
              currentMode === 'login'
                ? 'Entre em sua conta para continuar'
                : 'Preencha os dados para criar sua conta'
            }}
          </p>
        </div>

        <form
          v-if="currentMode === 'login'"
          @submit.prevent="handleLogin"
          class="login-form"
          novalidate
        >
          <div class="form-fields">
            <div class="field-group">
              <label for="username" class="field-label">E-mail</label>
              <div class="input-wrapper">
                <input
                  id="username"
                  v-model="userCredentials.username"
                  type="email"
                  placeholder="Digite seu e-mail"
                  class="form-input"
                  :disabled="isLoading"
                  @blur="validateEmail"
                  @input="clearError('username')"
                />
                <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
              </div>
            </div>

            <div class="field-group">
              <label for="password" class="field-label">Senha</label>
              <div class="input-wrapper">
                <div class="password-wrapper">
                  <input
                    id="password"
                    v-model="userCredentials.userPassword"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Digite sua senha"
                    class="form-input"
                    :disabled="isLoading"
                    @blur="validatePassword"
                    @input="clearError('userPassword')"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="togglePassword"
                    :disabled="isLoading"
                    tabindex="-1"
                  ></button>
                </div>
                <span v-if="errors.userPassword" class="error-text">{{ errors.userPassword }}</span>
              </div>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="rememberMe"
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="isLoading"
                />
                <span class="checkbox-text">Lembrar-me</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-medium login-button"
              :disabled="isLoading"
            >
              Entrar
            </button>
          </div>

          <div class="divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            class="btn btn-secondary btn-medium microsoft-button"
            @click="handleMicrosoftLogin"
            :disabled="isLoading || microsoftLoading"
          >
            <img src="/icons/microsoft.svg" alt="Microsoft" class="microsoft-icon" />
            Entrar com Microsoft
          </button>

          <div v-if="generalError" class="error-message">
            <span>{{ generalError }}</span>
          </div>

          <div class="form-footer">
            <p>
              Não tem uma conta?
              <a href="#" @click.prevent="switchMode('register')" class="access-link"
                >Criar conta</a
              >
            </p>
          </div>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="login-form" novalidate>
          <div class="form-fields">
            <div class="field-group">
              <label for="nome" class="field-label">Nome Completo</label>
              <div class="input-wrapper">
                <input
                  id="nome"
                  v-model="registerData.nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  class="form-input"
                  :disabled="isLoading"
                  @blur="validateName"
                  @input="clearError('nome')"
                />
                <span v-if="errors.nome" class="error-text">{{ errors.nome }}</span>
              </div>
            </div>

            <div class="field-group">
              <label for="email" class="field-label">E-mail</label>
              <div class="input-wrapper">
                <input
                  id="email"
                  v-model="registerData.email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  class="form-input"
                  :disabled="isLoading"
                  @blur="validateRegisterEmail"
                  @input="clearError('email')"
                />
                <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
              </div>
            </div>

            <div class="field-group">
              <label for="senha" class="field-label">Senha</label>
              <div class="input-wrapper">
                <div class="password-wrapper">
                  <input
                    id="senha"
                    v-model="registerData.senha"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Mínimo 8 caracteres"
                    class="form-input"
                    :disabled="isLoading"
                    @blur="validateRegisterPassword"
                    @input="clearError('senha')"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="togglePassword"
                    :disabled="isLoading"
                    tabindex="-1"
                  ></button>
                </div>
                <span v-if="errors.senha" class="error-text">{{ errors.senha }}</span>
              </div>
            </div>

            <div class="field-group">
              <label for="confirmSenha" class="field-label">Confirmar Senha</label>
              <div class="input-wrapper">
                <input
                  id="confirmSenha"
                  v-model="registerData.confirmSenha"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Confirme sua senha"
                  class="form-input"
                  :disabled="isLoading"
                  @blur="validateConfirmPassword"
                  @input="clearError('confirmSenha')"
                />
                <span v-if="errors.confirmSenha" class="error-text">{{ errors.confirmSenha }}</span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-medium login-button"
              :disabled="isLoading"
            >
              Criar Conta
            </button>
          </div>

          <div v-if="generalError" class="error-message">
            <span>{{ generalError }}</span>
          </div>

          <div class="form-footer">
            <p>
              Já tem uma conta?
              <a href="#" @click.prevent="switchMode('login')" class="access-link">Fazer login</a>
            </p>
          </div>
        </form>
      </div>

      <div class="login-image-section">
        <p>{{ welcomeMessage }}</p>
        <h1>Seja bem-vindo!</h1>
        <p>
          {{
            currentMode === 'login'
              ? 'Acesse o portal para continuar'
              : 'Cadastre-se para ter acesso aos sistemas'
          }}
        </p>
      </div>
    </div>

    <div class="copy">
      <p>&copy; 2025 Portal - v{{ appVersion }}</p>
    </div>

    <Transition name="toast">
      <div v-if="showSuccessToast" class="success-toast">
        <span>{{ successMessage }}</span>
      </div>
    </Transition>

    <VPopup
      v-model:visible="showPendingModal"
      msg="Aguardando Aprovação"
      mark="warning"
      :auto-close="0"
    >
      <div class="pending-content">
        <h3>Cadastro realizado com sucesso!</h3>
        <p>Sua conta foi criada e está aguardando aprovação do administrador.</p>
        <p>Você receberá um e-mail quando sua conta for aprovada.</p>
        <div class="pending-actions">
          <button class="btn btn-primary btn-medium" @click="showPendingModal = false">
            Entendi
          </button>
        </div>
      </div>
    </VPopup>
  </div>
</template>

<script>
import VPopup from '@/components/Popup/VPopup.vue'
import { useAuthStore } from '@/store/auth.js'

export default {
  name: 'LoginPage',
  components: { VPopup },

  data() {
    return {
      currentMode: 'login',
      userCredentials: {
        username: '',
        userPassword: '',
      },
      registerData: {
        nome: '',
        email: '',
        senha: '',
        confirmSenha: '',
      },
      errors: {
        username: '',
        userPassword: '',
        nome: '',
        email: '',
        senha: '',
        confirmSenha: '',
      },
      showPassword: false,
      rememberMe: false,
      generalError: '',
      showSuccessToast: false,
      showPendingModal: false,
      successMessage: '',
      appVersion: '1.0.0',
      microsoftLoading: false,
      loadingMessage: 'Autenticando...',
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },
    isLoading() {
      return this.authStore.isLoading
    },
    isAuthenticated() {
      return this.authStore.isAuthenticated
    },
    microsoftAuthInProgress() {
      return this.authStore.microsoftAuthInProgress
    },
    welcomeMessage() {
      const hour = new Date().getHours()
      if (hour < 12) return 'Bom dia!'
      if (hour < 18) return 'Boa tarde!'
      return 'Boa noite!'
    },
    isFormValid() {
      if (this.currentMode === 'login') {
        return (
          this.userCredentials.username.length > 0 &&
          this.userCredentials.userPassword.length > 0 &&
          !this.errors.username &&
          !this.errors.userPassword
        )
      } else {
        return (
          this.registerData.nome.length > 0 &&
          this.registerData.email.length > 0 &&
          this.registerData.senha.length > 0 &&
          this.registerData.confirmSenha.length > 0 &&
          !this.errors.nome &&
          !this.errors.email &&
          !this.errors.senha &&
          !this.errors.confirmSenha
        )
      }
    },
  },

  watch: {
    'authStore.error'(newError) {
      if (newError) {
        this.generalError = newError
      }
    },
    isAuthenticated(newValue) {
      if (newValue) {
        this.$router.push('/main')
      }
    },
    microsoftAuthInProgress(newValue) {
      this.microsoftLoading = newValue
      if (newValue) {
        this.loadingMessage = 'Autenticando com Microsoft...'
      }
    },
  },

  methods: {
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.userCredentials.username) {
        this.errors.username = 'Email é obrigatório'
      } else if (!emailRegex.test(this.userCredentials.username)) {
        this.errors.username = 'Email inválido'
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
    validateName() {
      if (!this.registerData.nome) {
        this.errors.nome = 'Nome é obrigatório'
      } else if (this.registerData.nome.length < 2) {
        this.errors.nome = 'Nome deve ter pelo menos 2 caracteres'
      } else {
        this.errors.nome = ''
      }
    },
    validateRegisterEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.registerData.email) {
        this.errors.email = 'Email é obrigatório'
      } else if (!emailRegex.test(this.registerData.email)) {
        this.errors.email = 'Email inválido'
      } else {
        this.errors.email = ''
      }
    },
    validateRegisterPassword() {
      const password = this.registerData.senha
      if (!password) {
        this.errors.senha = 'Senha é obrigatória'
      } else if (password.length < 8) {
        this.errors.senha = 'Senha deve ter pelo menos 8 caracteres'
      } else if (!/(?=.*[a-z])/.test(password)) {
        this.errors.senha = 'Senha deve ter pelo menos 1 letra minúscula'
      } else if (!/(?=.*[A-Z])/.test(password)) {
        this.errors.senha = 'Senha deve ter pelo menos 1 letra maiúscula'
      } else if (!/(?=.*\d)/.test(password)) {
        this.errors.senha = 'Senha deve ter pelo menos 1 número'
      } else {
        this.errors.senha = ''
        if (this.registerData.confirmSenha) {
          this.validateConfirmPassword()
        }
      }
    },
    validateConfirmPassword() {
      if (!this.registerData.confirmSenha) {
        this.errors.confirmSenha = 'Confirmação de senha é obrigatória'
      } else if (this.registerData.senha !== this.registerData.confirmSenha) {
        this.errors.confirmSenha = 'Senhas não coincidem'
      } else {
        this.errors.confirmSenha = ''
      }
    },
    clearError(field) {
      if (this.errors[field]) {
        this.errors[field] = ''
      }
      if (this.generalError) {
        this.generalError = ''
        this.authStore.clearError()
      }
    },
    togglePassword() {
      this.showPassword = !this.showPassword
    },
    switchMode(mode) {
      this.currentMode = mode
      this.clearAllErrors()
      this.resetForms()
    },
    clearAllErrors() {
      Object.keys(this.errors).forEach((key) => {
        this.errors[key] = ''
      })
      this.generalError = ''
      this.authStore.clearError()
    },
    resetForms() {
      this.userCredentials = {
        username: '',
        userPassword: '',
      }
      this.registerData = {
        nome: '',
        email: '',
        senha: '',
        confirmSenha: '',
      }
    },
    async handleLogin() {
      this.validateEmail()
      this.validatePassword()

      if (!this.isFormValid) {
        return
      }

      this.loadingMessage = 'Fazendo login...'

      try {
        const result = await this.authStore.loginCredentials(
          this.userCredentials.username,
          this.userCredentials.userPassword,
          this.rememberMe,
        )

        if (result.success) {
          if (this.rememberMe) {
            localStorage.setItem('rememberMe', 'true')
            localStorage.setItem('lastUsername', this.userCredentials.username)
          }
        } else {
          if (result.status === 403) {
            this.generalError = 'Usuário aguardando aprovação do administrador'
          } else if (result.status === 401) {
            this.generalError = 'Email ou senha incorretos'
          } else {
            this.generalError = result.error || 'Erro ao fazer login'
          }
        }
      } catch (error) {
        this.generalError = 'Erro interno no login'
      }
    },
    async handleMicrosoftLogin() {
      this.clearAllErrors()
      this.loadingMessage = 'Conectando com Microsoft...'

      try {
        const result = await this.authStore.startMicrosoftAuth()

        if (!result.success) {
          if (result.error.includes('pendente')) {
            this.generalError = 'Usuário aguardando aprovação do administrador'
          } else {
            this.generalError = result.error || 'Erro na autenticação Microsoft'
          }
        }
      } catch (error) {
        this.generalError = 'Erro ao conectar com Microsoft'
      }
    },
    async handleRegister() {
      this.validateName()
      this.validateRegisterEmail()
      this.validateRegisterPassword()
      this.validateConfirmPassword()

      if (!this.isFormValid) {
        return
      }

      this.loadingMessage = 'Criando conta...'

      const result = await this.authStore.register({
        nome: this.registerData.nome,
        email: this.registerData.email,
        senha: this.registerData.senha,
      })

      if (result.success) {
        this.showPendingModal = true
        this.resetForms()
        this.currentMode = 'login'
      } else {
        if (result.error.includes('já cadastrado')) {
          this.errors.email = 'Este email já está cadastrado'
        } else {
          this.generalError = result.error || 'Erro ao criar conta'
        }
      }
    },
    handleMicrosoftCallback() {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        this.generalError = 'Erro na autenticação Microsoft'
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (code) {
        this.completeMicrosoftLogin(code)
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    },
    async completeMicrosoftLogin(code) {
      this.loadingMessage = 'Finalizando autenticação Microsoft...'

      try {
        const result = await this.authStore.completeMicrosoftAuth(code)

        if (!result.success) {
          if (result.error.includes('pendente')) {
            this.showPendingModal = true
          } else {
            this.generalError = result.error || 'Erro na autenticação Microsoft'
          }
        }
      } catch (error) {
        this.generalError = 'Erro ao finalizar autenticação Microsoft'
      }
    },
    loadSavedCredentials() {
      if (localStorage.getItem('rememberMe') === 'true') {
        this.rememberMe = true
        this.userCredentials.username = localStorage.getItem('lastUsername') || ''
      }
    },
    handleKeyboard(event) {
      if (event.ctrlKey && event.key === 'Enter') {
        if (this.currentMode === 'login') {
          this.handleLogin()
        } else {
          this.handleRegister()
        }
      }
    },
    setupMessageListener() {
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
          this.completeMicrosoftLogin(event.data.code)
        } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
          this.generalError = event.data.error || 'Erro na autenticação Microsoft'
          this.microsoftLoading = false
        }
      })
    },
  },

  mounted() {
    this.loadSavedCredentials()
    this.handleMicrosoftCallback()
    this.setupMessageListener()
    document.addEventListener('keydown', this.handleKeyboard)

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
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: linear-gradient(135deg, var(--secundary-color) 0%, var(--grey-dark) 100%);
  padding: 1rem;
}

.copy {
  color: var(--white-color);
  font-weight: bold;
  font-size: 12px;
  padding: 1rem;
  position: absolute;
  bottom: 0;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1200px;
  min-height: 700px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
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
  background: rgba(255, 255, 255, 0.95);
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
  border: 3px solid var(--theme-color-hover);
  border-top: 3px solid var(--theme-color);
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

.login-form-section {
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #fff;
}

.login-header {
  margin-bottom: 2.5rem;
  text-align: center;
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--secundary-color);
  margin: 0 0 0.5rem 0;
  background: var(--badge-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
}

.login-form {
  width: 100%;
}

.form-fields {
  margin-bottom: 1.5rem;
}

.field-group {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--grey-color);
  border-radius: 12px;
  background-color: var(--white-color);
  color: var(--secundary-color);
  transition: all 0.3s ease;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-input::placeholder {
  color: var(--grey-light);
}

.form-input:focus {
  border-color: var(--theme-color);
  box-shadow:
    0 0 0 3px var(--theme-color-hover),
    0 4px 12px rgba(188, 31, 27, 0.15);
  transform: translateY(-1px);
}

.form-input:hover:not(:focus) {
  border-color: var(--grey-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #6c757d;
  transition: color 0.3s ease;
  font-size: 1.2rem;
}

.password-toggle:hover {
  color: var(--theme-color);
}

.error-text {
  display: block;
  color: var(--danger-color);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.checkbox-group {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 0.9rem;
  color: var(--grey-dark);
}

.form-actions {
  margin-bottom: 1.5rem;
}

.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  user-select: none;
}

.btn-medium {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  min-height: 40px;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--theme-color);
  color: white;
  border: 1px solid rgba(188, 31, 27, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #9a1916;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(188, 31, 27, 0.3);
}

.btn-secondary {
  background: white;
  color: #5e5e5e;
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f5f5;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
  z-index: 1;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: var(--grey-dark);
  font-size: 0.9rem;
  position: relative;
  z-index: 2;
}

.microsoft-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.microsoft-icon {
  width: 20px;
  height: 20px;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 8px;
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 1rem;
  text-align: center;
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
}

.form-footer p {
  font-size: 0.9rem;
  color: var(--grey-dark);
  margin: 0;
}

.access-link {
  color: var(--theme-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  cursor: pointer;
}

.access-link:hover {
  color: #9a1916;
  text-decoration: underline;
}

.login-image-section {
  position: relative;
  background-image: url('/login/1.png');
  background-position: center;
  background-size: cover;
  display: flex;
  flex-direction: column;
  gap: 25px;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-image-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 1;
}

.login-image-section > * {
  position: relative;
  color: var(--white-color);
  z-index: 2;
  text-align: center;
}

.login-image-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.login-image-section p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
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

.pending-content {
  text-align: center;
  padding: 1rem;
}

.pending-content h3 {
  color: var(--purple-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.pending-content p {
  margin-bottom: 1rem;
  color: #6c757d;
  line-height: 1.5;
}

.pending-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 968px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 500px;
    min-height: auto;
  }

  .login-image-section {
    order: -1;
    min-height: 200px;
  }

  .login-form-section {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 2rem;
  }

  .login-image-section h1 {
    font-size: 2rem;
  }

  .login-image-section p {
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .form-input {
    padding: 0.75rem 0.875rem;
    font-size: 0.9rem;
  }

  .field-label {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 0.5rem;
  }

  .login-form-section {
    padding: 1.5rem 1rem;
  }

  .login-title {
    font-size: 1.75rem;
    gap: 10px;
  }

  .login-title img {
    height: 28px;
  }

  .field-group {
    margin-bottom: 1.25rem;
  }

  .login-image-section h1 {
    font-size: 1.5rem;
  }

  .login-image-section p {
    font-size: 0.9rem;
  }

  .copy {
    font-size: 10px;
    padding: 0.5rem;
  }
}
</style>
