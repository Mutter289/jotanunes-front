<!-- views/MicrosoftCallback.vue -->
<template>
  <div class="callback-container">
    <div class="callback-card">
      <!-- Loading State -->
      <div v-if="isProcessing" class="callback-loading">
        <div class="loading-spinner"></div>
        <h2>Processando autenticação Microsoft...</h2>
        <p>Aguarde enquanto validamos suas credenciais.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="authSuccess" class="callback-success">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Autenticação realizada com sucesso!</h2>
        <p>Redirecionando para o sistema...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="authError" class="callback-error">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Erro na autenticação</h2>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <VButton
            text="Tentar novamente"
            variant="primary"
            @click="retryAuth"
          />
          <VButton
            text="Voltar ao login"
            variant="secondary"
            @click="goToLogin"
          />
        </div>
      </div>

      <!-- Pending State -->
      <div v-else-if="isPending" class="callback-pending">
        <div class="pending-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <h2>Cadastro realizado com sucesso!</h2>
        <p>Sua conta via Microsoft foi criada e está aguardando aprovação do administrador.</p>
        <p>Você receberá um e-mail quando sua conta for aprovada.</p>
        <div class="pending-actions">
          <VButton
            text="Entendi"
            variant="primary"
            @click="goToLogin"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import VButton from '@/components/Button/VButton.vue'

// Router e store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Estados
const isProcessing = ref(true)
const authSuccess = ref(false)
const authError = ref(false)
const isPending = ref(false)
const errorMessage = ref('')
const progressWidth = ref(0)

// Timers
let redirectTimer = null
let progressTimer = null

// Métodos
async function processCallback() {
  try {
    // Obter parâmetros da URL
    const code = route.query.code
    const error = route.query.error
    const errorDescription = route.query.error_description

    // Verificar se há erro do Microsoft
    if (error) {
      handleAuthError(getErrorMessage(error, errorDescription))
      return
    }

    // Verificar se temos código de autorização
    if (!code) {
      handleAuthError('Código de autorização não encontrado')
      return
    }

    // Processar login com Microsoft
    const result = await authStore.completeMicrosoftAuth(code)

    if (result.success) {
      // Sucesso - mostrar tela de sucesso e redirecionar
      handleAuthSuccess()
    } else {
      // Verificar se é erro de usuário pendente
      if (result.error && result.error.includes('pendente')) {
        handlePendingUser()
      } else {
        handleAuthError(result.error || 'Erro na autenticação Microsoft')
      }
    }

  } catch (error) {
    console.error('Erro no callback:', error)
    handleAuthError('Erro interno na autenticação')
  }
}

function handleAuthSuccess() {
  isProcessing.value = false
  authSuccess.value = true
  
  // Iniciar barra de progresso
  startProgressBar()
  
  // Redirecionar após 3 segundos
  redirectTimer = setTimeout(() => {
    router.push('/dashboard')
  }, 3000)
}

function handleAuthError(message) {
  isProcessing.value = false
  authError.value = true
  errorMessage.value = message
}

function handlePendingUser() {
  isProcessing.value = false
  isPending.value = true
}

function startProgressBar() {
  let progress = 0
  progressTimer = setInterval(() => {
    progress += 2
    progressWidth.value = Math.min(progress, 100)
    
    if (progress >= 100) {
      clearInterval(progressTimer)
    }
  }, 60) // 3 segundos total (50 * 60ms)
}

function getErrorMessage(error, description) {
  const errorMessages = {
    'access_denied': 'Acesso negado pelo usuário',
    'invalid_request': 'Requisição inválida',
    'unauthorized_client': 'Cliente não autorizado',
    'server_error': 'Erro interno do servidor Microsoft',
    'temporarily_unavailable': 'Serviço temporariamente indisponível'
  }
  
  return errorMessages[error] || description || 'Erro desconhecido na autenticação Microsoft'
}

function retryAuth() {
  // Limpar estados
  isProcessing.value = true
  authError.value = false
  authSuccess.value = false
  isPending.value = false
  errorMessage.value = ''
  
  // Tentar novamente
  setTimeout(processCallback, 1000)
}

function goToLogin() {
  router.push('/')
}

// Cleanup
function cleanup() {
  if (redirectTimer) {
    clearTimeout(redirectTimer)
    redirectTimer = null
  }
  
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// Lifecycle
onMounted(() => {
  // Processar callback após pequeno delay para mostrar loading
  setTimeout(processCallback, 1000)
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.callback-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  text-align: center;
}

/* Loading State */
.callback-loading {
  padding: 3rem 2rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.callback-loading h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.callback-loading p {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

/* Success State */
.callback-success {
  padding: 3rem 2rem;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 1.5rem;
}

.callback-success h2 {
  margin: 0 0 1rem 0;
  color: #28a745;
  font-size: 1.5rem;
  font-weight: 600;
}

.callback-success p {
  margin: 0 0 2rem 0;
  color: #6c757d;
  font-size: 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
  border-radius: 3px;
  transition: width 0.1s ease;
}

/* Error State */
.callback-error {
  padding: 3rem 2rem;
}

.error-icon {
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1.5rem;
}

.callback-error h2 {
  margin: 0 0 1rem 0;
  color: #dc3545;
  font-size: 1.5rem;
  font-weight: 600;
}

.callback-error p {
  margin: 0 0 2rem 0;
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Pending State */
.callback-pending {
  padding: 3rem 2rem;
}

.pending-icon {
  font-size: 4rem;
  color: #ffc107;
  margin-bottom: 1.5rem;
}

.callback-pending h2 {
  margin: 0 0 1rem 0;
  color: #856404;
  font-size: 1.5rem;
  font-weight: 600;
}

.callback-pending p {
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.5;
}

.callback-pending p:last-of-type {
  margin-bottom: 2rem;
  font-weight: 500;
}

.pending-actions {
  display: flex;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .callback-container {
    padding: 1rem;
  }
  
  .callback-card {
    max-width: 100%;
  }
  
  .callback-loading,
  .callback-success,
  .callback-error,
  .callback-pending {
    padding: 2rem 1.5rem;
  }
  
  .success-icon,
  .error-icon,
  .pending-icon {
    font-size: 3rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .callback-loading h2,
  .callback-success h2,
  .callback-error h2,
  .callback-pending h2 {
    font-size: 1.25rem;
  }
  
  .callback-loading p,
  .callback-success p,
  .callback-error p,
  .callback-pending p {
    font-size: 0.9rem;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.callback-loading,
.callback-success,
.callback-error,
.callback-pending {
  animation: fadeIn 0.5s ease;
}

.success-icon {
  animation: fadeIn 0.5s ease 0.2s both;
}

.error-icon,
.pending-icon {
  animation: fadeIn 0.5s ease 0.2s both;
}
</style>