<template>
  <div class="user-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Gestão de Usuários</h1>
        <p>Administre usuários, aprove cadastros e gerencie permissões</p>
      </div>
      <div class="header-actions">
        <VButton
          text="Novo Usuário"
          variant="add"
          @click="openCreateModal"
        />
        <VButton
          text="Atualizar"
          variant="secondary"
          @click="loadUsers"
          :loading="isLoading"
        />
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Filtrar por Status:</label>
        <select v-model="statusFilter" @change="applyFilters" class="filter-select">
          <option value="">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Tipo de Login:</label>
        <select v-model="tipoFilter" @change="applyFilters" class="filter-select">
          <option value="">Todos</option>
          <option value="credenciais">Email/Senha</option>
          <option value="microsoft">Microsoft OAuth</option>
        </select>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-number">{{ statistics.total_usuarios || 0 }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card pending">
          <span class="stat-number">{{ statistics.usuarios_pendentes || 0 }}</span>
          <span class="stat-label">Pendentes</span>
        </div>
        <div class="stat-card active">
          <span class="stat-number">{{ statistics.usuarios_ativos || 0 }}</span>
          <span class="stat-label">Ativos</span>
        </div>
        <div class="stat-card blocked">
          <span class="stat-number">{{ statistics.usuarios_bloqueados || 0 }}</span>
          <span class="stat-label">Bloqueados</span>
        </div>
      </div>
    </div>

    <!-- Tabela de Usuários -->
    <VTable
      :data="filteredUsers"
      :columns="tableColumns"
      :actions="tableActions"
      :searchable="true"
      :selectable="true"
      :paginate="true"
      :pageSize="15"
      searchPlaceholder="Buscar por nome, email..."
      @action="handleTableAction"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
      @refresh="loadUsers"
    >
      <!-- Slot customizado para status -->
      <template #cell-status="{ value }">
        <span :class="['status-badge', `status-${value}`]">
          {{ formatStatus(value) }}
        </span>
      </template>

      <!-- Slot customizado para tipo de login -->
      <template #cell-tipo_login="{ value }">
        <span :class="['login-type', `type-${value}`]">
          <FontAwesomeIcon :icon="getLoginTypeIcon(value)" />
          {{ formatLoginType(value) }}
        </span>
      </template>

      <!-- Slot customizado para último login -->
      <template #cell-ultimo_login="{ value }">
        <span v-if="value" class="date-display">
          {{ formatDate(value) }}
        </span>
        <span v-else class="no-data">Nunca</span>
      </template>

      <!-- Slot customizado para data de criação -->
      <template #cell-criado_em="{ value }">
        <span class="date-display">
          {{ formatDate(value) }}
        </span>
      </template>
    </VTable>

    <!-- Modal de Criar/Editar Usuário -->
    <VPopup
      v-model:visible="showUserModal"
      :msg="isEditing ? 'Editar Usuário' : 'Novo Usuário'"
      mark="info"
      :auto-close="0"
    >
      <form @submit.prevent="saveUser" class="user-form">
        <div class="form-group">
          <label>Nome *</label>
          <input
            v-model="userForm.nome"
            type="text"
            class="form-input"
            placeholder="Nome completo"
            required
          />
        </div>

        <div class="form-group">
          <label>Email *</label>
          <input
            v-model="userForm.email"
            type="email"
            class="form-input"
            placeholder="email@exemplo.com"
            required
            :disabled="isEditing"
          />
        </div>

        <div v-if="!isEditing" class="form-group">
          <label>Senha *</label>
          <input
            v-model="userForm.senha"
            type="password"
            class="form-input"
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>

        <div class="form-group">
          <label>Status</label>
          <select v-model="userForm.status" class="form-select">
            <option value="pendente">Pendente</option>
            <option value="ativo">Ativo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </div>

        <div v-if="formError" class="form-error">
          {{ formError }}
        </div>
      </form>

      <template #footer>
        <div class="modal-actions">
          <VButton
            text="Cancelar"
            variant="secondary"
            @click="closeUserModal"
          />
          <VButton
            :text="isEditing ? 'Salvar' : 'Criar'"
            variant="add"
            @click="saveUser"
            :loading="isSaving"
          />
        </div>
      </template>
    </VPopup>

    <!-- Modal de Confirmação -->
    <VPopup
      v-model:visible="showConfirmModal"
      :msg="confirmData.title"
      mark="warning"
      :auto-close="0"
    >
      <div class="confirm-content">
        <p>{{ confirmData.message }}</p>
        <div v-if="confirmData.type === 'block'" class="form-group">
          <label>Motivo do bloqueio:</label>
          <textarea
            v-model="blockReason"
            class="form-textarea"
            placeholder="Informe o motivo do bloqueio..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="modal-actions">
          <VButton
            text="Cancelar"
            variant="secondary"
            @click="closeConfirmModal"
          />
          <VButton
            :text="confirmData.confirmText"
            :variant="confirmData.variant"
            @click="executeAction"
            :loading="isExecuting"
          />
        </div>
      </template>
    </VPopup>

    <!-- Modal de Ações em Lote -->
    <VPopup
      v-model:visible="showBatchModal"
      msg="Ações em Lote"
      mark="info"
      :auto-close="0"
    >
      <div class="batch-content">
        <p>{{ selectedUsers.length }} usuário(s) selecionado(s)</p>
        <div class="batch-actions">
          <VButton
            text="Aprovar Selecionados"
            variant="primary"
            @click="batchApprove"
            :disabled="!canBatchApprove"
          />
          <VButton
            text="Bloquear Selecionados"
            variant="danger"
            @click="batchBlock"
            :disabled="selectedUsers.length === 0"
          />
        </div>
      </div>

      <template #footer>
        <VButton
          text="Fechar"
          variant="secondary"
          @click="showBatchModal = false"
        />
      </template>
    </VPopup>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VButton from '@/components/Button/VButton.vue'
import VPopup from '@/components/Popup/VPopup.vue'
import { useAuthStore } from '@/store/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  name: 'UserView',
  components: { VTable, VButton, VPopup, FontAwesomeIcon },

  data() {
    return {
      users: [],
      filteredUsers: [],
      selectedUsers: [],
      statistics: {},
      isLoading: false,
      isSaving: false,
      isExecuting: false,
      
      // Filtros
      statusFilter: '',
      tipoFilter: '',
      
      // Modal de usuário
      showUserModal: false,
      isEditing: false,
      userForm: {
        nome: '',
        email: '',
        senha: '',
        status: 'pendente'
      },
      formError: '',
      
      // Modal de confirmação
      showConfirmModal: false,
      confirmData: {},
      blockReason: '',
      currentAction: null,
      currentUser: null,
      
      // Modal de ações em lote
      showBatchModal: false,
      
      // Configuração da tabela
      tableColumns: [
        {
          key: 'nome',
          label: 'Nome',
          sortable: true,
          width: '200px'
        },
        {
          key: 'email',
          label: 'Email',
          sortable: true,
          width: '250px'
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          width: '120px',
          align: 'center'
        },
        {
          key: 'tipo_login',
          label: 'Tipo Login',
          sortable: true,
          width: '140px',
          align: 'center'
        },
        {
          key: 'ultimo_login',
          label: 'Último Login',
          sortable: true,
          width: '160px'
        },
        {
          key: 'criado_em',
          label: 'Criado em',
          sortable: true,
          width: '160px'
        }
      ]
    }
  },

  computed: {
    authStore() {
      return useAuthStore()
    },

    tableActions() {
      return [
        {
          key: 'edit',
          label: 'Editar',
          icon: 'edit',
          variant: 'primary'
        },
        {
          key: 'approve',
          label: 'Aprovar',
          icon: 'check',
          variant: 'success',
          disabled: (row) => row.status !== 'pendente'
        },
        {
          key: 'block',
          label: 'Bloquear',
          icon: 'ban',
          variant: 'danger',
          disabled: (row) => row.status === 'bloqueado'
        },
        {
          key: 'delete',
          label: 'Excluir',
          icon: 'trash',
          variant: 'danger'
        }
      ]
    },

    canBatchApprove() {
      return this.selectedUsers.some(user => user.status === 'pendente')
    }
  },

  async mounted() {
    await this.loadUsers()
    await this.loadStatistics()
  },

  methods: {
    // ==================== CARREGAMENTO DE DADOS ====================
    async loadUsers() {
      this.isLoading = true
      try {
        this.users = await this.authStore.getUsers()
        this.applyFilters()
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        this.showToast('error', 'Erro', 'Falha ao carregar usuários')
      } finally {
        this.isLoading = false
      }
    },

    async loadStatistics() {
      try {
        this.statistics = await this.authStore.getStatistics()
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    },

    applyFilters() {
      let filtered = [...this.users]

      if (this.statusFilter) {
        filtered = filtered.filter(user => user.status === this.statusFilter)
      }

      if (this.tipoFilter) {
        filtered = filtered.filter(user => user.tipo_login === this.tipoFilter)
      }

      this.filteredUsers = filtered
    },

    // ==================== AÇÕES DA TABELA ====================
    handleTableAction({ action, row }) {
      this.currentUser = row
      
      switch (action.key) {
        case 'edit':
          this.editUser(row)
          break
        case 'approve':
          this.confirmApprove(row)
          break
        case 'block':
          this.confirmBlock(row)
          break
        case 'delete':
          this.confirmDelete(row)
          break
      }
    },

    handleRowClick(row) {
      console.log('Usuário clicado:', row)
    },

    handleSelectionChange(selected) {
      this.selectedUsers = selected
      if (selected.length > 0) {
        this.showBatchModal = true
      }
    },

    // ==================== CRUD OPERATIONS ====================
    openCreateModal() {
      this.isEditing = false
      this.userForm = {
        nome: '',
        email: '',
        senha: '',
        status: 'pendente'
      }
      this.formError = ''
      this.showUserModal = true
    },

    editUser(user) {
      this.isEditing = true
      this.userForm = {
        nome: user.nome,
        email: user.email,
        senha: '',
        status: user.status
      }
      this.formError = ''
      this.showUserModal = true
    },

    async saveUser() {
      this.isSaving = true
      this.formError = ''
      
      try {
        if (this.isEditing) {
          // Atualizar usuário (endpoint não disponível na API atual)
          this.showToast('warning', 'Aviso', 'Edição de usuário não implementada na API')
        } else {
          // Criar novo usuário
          const result = await this.authStore.register({
            nome: this.userForm.nome,
            email: this.userForm.email,
            senha: this.userForm.senha
          })

          if (result.success) {
            this.showToast('success', 'Sucesso', 'Usuário criado com sucesso')
            this.closeUserModal()
            await this.loadUsers()
            await this.loadStatistics()
          } else {
            this.formError = result.error
          }
        }
      } catch (error) {
        this.formError = 'Erro ao salvar usuário'
        console.error('Erro ao salvar usuário:', error)
      } finally {
        this.isSaving = false
      }
    },

    closeUserModal() {
      this.showUserModal = false
      this.userForm = { nome: '', email: '', senha: '', status: 'pendente' }
      this.formError = ''
      this.isEditing = false
    },

    // ==================== CONFIRMAÇÕES ====================
    confirmApprove(user) {
      this.confirmData = {
        title: 'Aprovar Usuário',
        message: `Deseja aprovar o usuário "${user.nome}"?`,
        confirmText: 'Aprovar',
        variant: 'primary',
        type: 'approve'
      }
      this.showConfirmModal = true
    },

    confirmBlock(user) {
      this.blockReason = ''
      this.confirmData = {
        title: 'Bloquear Usuário',
        message: `Deseja bloquear o usuário "${user.nome}"?`,
        confirmText: 'Bloquear',
        variant: 'danger',
        type: 'block'
      }
      this.showConfirmModal = true
    },

    confirmDelete(user) {
      this.confirmData = {
        title: 'Excluir Usuário',
        message: `Deseja excluir permanentemente o usuário "${user.nome}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        variant: 'danger',
        type: 'delete'
      }
      this.showConfirmModal = true
    },

    async executeAction() {
      this.isExecuting = true
      
      try {
        switch (this.confirmData.type) {
          case 'approve':
            await this.authStore.approveUser(this.currentUser.id)
            this.showToast('success', 'Sucesso', 'Usuário aprovado com sucesso')
            break
            
          case 'block':
            if (!this.blockReason.trim()) {
              this.showToast('warning', 'Aviso', 'Informe o motivo do bloqueio')
              return
            }
            await this.authStore.blockUser(this.currentUser.id, this.blockReason)
            this.showToast('success', 'Sucesso', 'Usuário bloqueado com sucesso')
            break
            
          case 'delete':
            // Endpoint de delete não disponível na API atual
            this.showToast('warning', 'Aviso', 'Exclusão de usuário não implementada na API')
            break
        }
        
        this.closeConfirmModal()
        await this.loadUsers()
        await this.loadStatistics()
        
      } catch (error) {
        console.error('Erro ao executar ação:', error)
        this.showToast('error', 'Erro', 'Falha ao executar ação')
      } finally {
        this.isExecuting = false
      }
    },

    closeConfirmModal() {
      this.showConfirmModal = false
      this.confirmData = {}
      this.blockReason = ''
      this.currentUser = null
    },

    // ==================== AÇÕES EM LOTE ====================
    async batchApprove() {
      const pendingUsers = this.selectedUsers.filter(user => user.status === 'pendente')
      
      this.isExecuting = true
      try {
        for (const user of pendingUsers) {
          await this.authStore.approveUser(user.id)
        }
        
        this.showToast('success', 'Sucesso', `${pendingUsers.length} usuário(s) aprovado(s)`)
        this.showBatchModal = false
        this.selectedUsers = []
        await this.loadUsers()
        await this.loadStatistics()
        
      } catch (error) {
        this.showToast('error', 'Erro', 'Falha na aprovação em lote')
      } finally {
        this.isExecuting = false
      }
    },

    async batchBlock() {
      const reason = prompt('Motivo do bloqueio em lote:')
      if (!reason) return

      this.isExecuting = true
      try {
        for (const user of this.selectedUsers) {
          if (user.status !== 'bloqueado') {
            await this.authStore.blockUser(user.id, reason)
          }
        }
        
        this.showToast('success', 'Sucesso', `${this.selectedUsers.length} usuário(s) bloqueado(s)`)
        this.showBatchModal = false
        this.selectedUsers = []
        await this.loadUsers()
        await this.loadStatistics()
        
      } catch (error) {
        this.showToast('error', 'Erro', 'Falha no bloqueio em lote')
      } finally {
        this.isExecuting = false
      }
    },

    // ==================== FORMATADORES ====================
    formatStatus(status) {
      const statusMap = {
        ativo: 'Ativo',
        pendente: 'Pendente',
        bloqueado: 'Bloqueado'
      }
      return statusMap[status] || status
    },

    formatLoginType(type) {
      const typeMap = {
        credenciais: 'Email/Senha',
        microsoft: 'Microsoft'
      }
      return typeMap[type] || type
    },

    getLoginTypeIcon(type) {
      return type === 'microsoft' ? 'key' : 'envelope'
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A'
      
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    // ==================== UTILITÁRIOS ====================
    showToast(type, title, message) {
      // Utilizar o sistema de toast global do App.vue
      if (window.showToast) {
        window.showToast(type, title, message)
      } else {
        alert(`${title}: ${message}`)
      }
    }
  }
}
</script>

<style scoped>
.user-management {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Filtros */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 150px;
}

.stats-cards {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  min-width: 80px;
  border: 2px solid transparent;
}

.stat-card.pending {
  border-color: #ffc107;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
}

.stat-card.active {
  border-color: #28a745;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
}

.stat-card.blocked {
  border-color: #dc3545;
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Status badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-ativo {
  background: #28a745;
  color: white;
}

.status-pendente {
  background: #ffc107;
  color: #856404;
}

.status-bloqueado {
  background: #dc3545;
  color: white;
}

/* Login type */
.login-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.type-microsoft {
  color: #0078d4;
}

.type-credenciais {
  color: #6c757d;
}

/* Date display */
.date-display {
  font-size: 0.9rem;
  color: #495057;
}

.no-data {
  color: #adb5bd;
  font-style: italic;
}

/* Modais */
.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #495057;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f8f9fa;
  color: #6c757d;
}

.form-error {
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 6px;
  color: #dc3545;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.confirm-content p {
  margin: 0 0 1rem 0;
  color: #495057;
  line-height: 1.5;
}

.batch-content p {
  margin: 0 0 1.5rem 0;
  font-weight: 600;
  color: #495057;
}

.batch-actions {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

/* Responsive */
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .stats-cards {
    margin-left: 0;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .user-form {
    min-width: 300px;
  }

  .stats-cards {
    flex-wrap: wrap;
  }

  .stat-card {
    min-width: 70px;
    padding: 0.75rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}
</style>