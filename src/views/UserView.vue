<template>
  <div class="user-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Gestão de Usuários</h1>
        <p>Administre usuários, aprove cadastros e gerencie permissões</p>
      </div>
      <div class="header-actions">
        <button class="btn-create" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Usuário
        </button>
        <button
          class="btn-refresh"
          @click="loadUsers"
          :class="{ rotating: isLoading }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="stats-section">
      <div class="stat-card total">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ statistics.total_usuarios || 0 }}</span>
          <span class="stat-label">Total de Usuários</span>
        </div>
        <div class="stat-bg-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
      </div>

      <div class="stat-card pending">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ statistics.usuarios_pendentes || 0 }}</span>
          <span class="stat-label">Aguardando Aprovação</span>
        </div>
        <div class="stat-bg-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </div>
      </div>

      <div class="stat-card active">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ statistics.usuarios_ativos || 0 }}</span>
          <span class="stat-label">Usuários Ativos</span>
        </div>
        <div class="stat-bg-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </div>
      </div>

      <div class="stat-card blocked">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-number">{{ statistics.usuarios_bloqueados || 0 }}</span>
          <span class="stat-label">Usuários Bloqueados</span>
        </div>
        <div class="stat-bg-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
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
        <span :class="['status-badge', `status-${value.toLowerCase()}`]">
          {{ formatStatus(value) }}
        </span>
      </template>

      <!-- Slot customizado para tipo de login -->
      <template #cell-tipo_login="{ value }">
        <span :class="['login-type', `type-${value.toLowerCase()}`]">
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
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modern-modal" :class="{ 'modal-visible': showUserModal }">
        <!-- Header do Modal -->
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">
              <svg
                v-if="!isEditing"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                ></path>
              </svg>
            </div>
            <div class="modal-title-wrapper">
              <h2>{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</h2>
              <p>{{ isEditing ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário' }}</p>
            </div>
          </div>
          <button class="modal-close" @click="closeUserModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body do Modal -->
        <form @submit.prevent="saveUser" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Nome Completo
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="userForm.nome"
                  type="text"
                  class="form-input"
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Endereço de Email
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="userForm.email"
                  type="email"
                  class="form-input"
                  placeholder="email@exemplo.com"
                  required
                  :disabled="isEditing"
                />
              </div>
            </div>

            <div v-if="!isEditing" class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Senha
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  v-model="userForm.senha"
                  type="password"
                  class="form-input"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                Status do Usuário
              </label>
              <div class="input-wrapper">
                <select v-model="userForm.status" class="form-select">
                  <option value="PENDENTE">Pendente</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
                <svg
                  class="select-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div v-if="formError" class="form-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ formError }}
          </div>
        </form>

        <!-- Footer do Modal -->
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeUserModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancelar
          </button>
          <button
            type="button"
            class="btn-submit"
            @click="saveUser"
            :disabled="isSaving"
            :class="{ loading: isSaving }"
          >
            <svg
              v-if="!isSaving"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path v-if="isEditing" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline v-if="isEditing" points="17 21 17 13 7 13 7 21"></polyline>
              <polyline v-if="isEditing" points="7 3 7 8 15 8"></polyline>
              <path v-if="!isEditing" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle v-if="!isEditing" cx="9" cy="7" r="4"></circle>
              <line v-if="!isEditing" x1="19" y1="8" x2="19" y2="14"></line>
              <line v-if="!isEditing" x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <div v-else class="spinner"></div>
            {{ isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Adicionar Usuário') }}
          </button>
        </div>
      </div>
    </div>

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
          <VButton text="Cancelar" variant="secondary" @click="closeConfirmModal" />
          <VButton
            :text="confirmData.confirmText"
            :variant="confirmData.variant"
            @click="executeAction"
            :loading="isExecuting"
          />
        </div>
      </template>
    </VPopup>

    <VPopup v-model:visible="showBatchModal" msg="Ações em Lote" mark="info" :auto-close="0">
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
        <VButton text="Fechar" variant="secondary" @click="showBatchModal = false" />
      </template>
    </VPopup>
  </div>
</template>

<script>
import VTable from '@/components/Table/VTable.vue'
import VPopup from '@/components/Popup/VPopup.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/store/auth.js'
import { useFetch } from '@/hooks/useFetch.js'

export default {
  components: { VTable, VPopup, FontAwesomeIcon },
  data() {
    return {
      users: [],
      filteredUsers: [],
      selectedUsers: [],
      statistics: {},
      isLoading: false,
      isSaving: false,
      isExecuting: false,
      showUserModal: false,
      isEditing: false,
      userForm: {
        nome: '',
        email: '',
        senha: '',
        status: 'PENDENTE',
      },
      formError: '',
      showConfirmModal: false,
      confirmData: {},
      blockReason: '',
      currentAction: null,
      currentUser: null,
      showBatchModal: false,
      tableColumns: [
        {
          key: 'nome',
          label: 'Nome',
          sortable: true,
          width: '200px',
        },
        {
          key: 'email',
          label: 'Email',
          sortable: true,
          width: '250px',
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          width: '120px',
          align: 'center',
        },
        {
          key: 'tipo_login',
          label: 'Tipo Login',
          sortable: true,
          width: '140px',
          align: 'center',
        },
        {
          key: 'ultimo_login',
          label: 'Último Login',
          sortable: true,
          width: '160px',
        },
        {
          key: 'criado_em',
          label: 'Criado em',
          sortable: true,
          width: '160px',
        },
      ],
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
          variant: 'primary',
        },
        {
          key: 'approve',
          label: 'Aprovar',
          icon: 'check',
          variant: 'success',
          disabled: (row) => row.status !== 'PENDENTE',
        },
        {
          key: 'block',
          label: 'Bloquear',
          icon: 'ban',
          variant: 'danger',
          disabled: (row) => row.status === 'BLOQUEADO',
        },
        {
          key: 'delete',
          label: 'Excluir',
          icon: 'trash',
          variant: 'danger',
        },
      ]
    },

    canBatchApprove() {
      return this.selectedUsers.some((user) => user.status === 'PENDENTE')
    },
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
        this.users = await useFetch('/api/auth/admin/usuarios')
        this.filteredUsers = [...this.users]
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        this.showToast('error', 'Erro', 'Falha ao carregar usuários')
      } finally {
        this.isLoading = false
      }
    },

    async loadStatistics() {
      try {
        this.statistics = await useFetch('/api/auth/admin/estatisticas')
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
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
        status: 'PENDENTE',
      }
      this.formError = ''
      this.showUserModal = true
    },

    editUser(user) {
      this.isEditing = true
      this.userForm = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        senha: '',
        status: user.status,
      }
      this.formError = ''
      this.showUserModal = true
    },

    async saveUser() {
      this.isSaving = true
      this.formError = ''

      try {
        if (this.isEditing) {
          const updateData = {
            nome: this.userForm.nome,
            status: this.userForm.status,
          }

          await useFetch(`/api/auth/admin/usuarios/${this.userForm.id}`, {
            method: 'PUT',
            body: updateData,
          })

          this.showToast('success', 'Sucesso', 'Usuário atualizado com sucesso')
        } else {
          await useFetch('/api/auth/cadastro', {
            method: 'POST',
            body: {
              nome: this.userForm.nome,
              email: this.userForm.email,
              senha: this.userForm.senha,
            },
          })

          this.showToast('success', 'Sucesso', 'Usuário criado com sucesso')
        }

        this.closeUserModal()
        await this.loadUsers()
        await this.loadStatistics()
      } catch (error) {
        this.formError = error.message || 'Erro ao salvar usuário'
        console.error('Erro ao salvar usuário:', error)
      } finally {
        this.isSaving = false
      }
    },

    closeUserModal() {
      this.showUserModal = false
      this.userForm = { nome: '', email: '', senha: '', status: 'PENDENTE' }
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
        type: 'approve',
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
        type: 'block',
      }
      this.showConfirmModal = true
    },

    confirmDelete(user) {
      this.confirmData = {
        title: 'Excluir Usuário',
        message: `Deseja excluir permanentemente o usuário "${user.nome}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        variant: 'danger',
        type: 'delete',
      }
      this.showConfirmModal = true
    },

    async executeAction() {
      this.isExecuting = true

      try {
        switch (this.confirmData.type) {
          case 'approve':
            await useFetch(`/api/auth/admin/usuarios/${this.currentUser.id}/aprovar`, {
              method: 'POST',
              body: { aprovado_por: this.authStore.user.email },
            })
            this.showToast('success', 'Sucesso', 'Usuário aprovado com sucesso')
            break

          case 'block':
            if (!this.blockReason.trim()) {
              this.showToast('warning', 'Aviso', 'Informe o motivo do bloqueio')
              return
            }

            await useFetch(`/api/auth/admin/usuarios/${this.currentUser.id}/bloquear`, {
              method: 'POST',
              body: {
                bloqueado_por: this.authStore.user.email,
                motivo: this.blockReason,
              },
            })
            this.showToast('success', 'Sucesso', 'Usuário bloqueado com sucesso')
            break

          case 'delete':
            await useFetch(`/api/auth/admin/usuarios/${this.currentUser.id}`, {
              method: 'DELETE',
            })
            this.showToast('success', 'Sucesso', 'Usuário excluído com sucesso')
            break
        }

        this.closeConfirmModal()
        await this.loadUsers()
        await this.loadStatistics()
      } catch (error) {
        console.error('Erro ao executar ação:', error)
        this.showToast('error', 'Erro', error.message || 'Falha ao executar ação')
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
      const pendingUsers = this.selectedUsers.filter((user) => user.status === 'PENDENTE')

      this.isExecuting = true
      try {
        await useFetch('/api/auth/admin/usuarios/bulk/aprovar', {
          method: 'POST',
          body: {
            usuario_ids: pendingUsers.map((u) => u.id),
            aprovado_por: this.authStore.user.email,
          },
        })

        this.showToast('success', 'Sucesso', `${pendingUsers.length} usuário(s) aprovado(s)`)
        this.showBatchModal = false
        this.selectedUsers = []
        await this.loadUsers()
        await this.loadStatistics()
      } catch (error) {
        this.showToast('error', 'Erro', error.message || 'Falha na aprovação em lote')
      } finally {
        this.isExecuting = false
      }
    },

    async batchBlock() {
      const reason = prompt('Motivo do bloqueio em lote:')
      if (!reason) return

      this.isExecuting = true
      try {
        await useFetch('/api/auth/admin/usuarios/bulk/bloquear', {
          method: 'POST',
          body: {
            usuario_ids: this.selectedUsers.map((u) => u.id),
            motivo: reason,
            bloqueado_por: this.authStore.user.email,
          },
        })

        this.showToast('success', 'Sucesso', `${this.selectedUsers.length} usuário(s) bloqueado(s)`)
        this.showBatchModal = false
        this.selectedUsers = []
        await this.loadUsers()
        await this.loadStatistics()
      } catch (error) {
        this.showToast('error', 'Erro', error.message || 'Falha no bloqueio em lote')
      } finally {
        this.isExecuting = false
      }
    },

    // ==================== FORMATADORES ====================

    formatStatus(status) {
      const statusMap = {
        ATIVO: 'Ativo',
        PENDENTE: 'Pendente',
        BLOQUEADO: 'Bloqueado',
      }
      return statusMap[status] || status
    },

    formatLoginType(type) {
      const typeMap = {
        CREDENCIAIS: 'Email/Senha',
        MICROSOFT: 'Microsoft',
      }
      return typeMap[type] || type
    },

    getLoginTypeIcon(type) {
      return type === 'MICROSOFT' ? 'key' : 'envelope'
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A'

      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    // ==================== UTILITÁRIOS ====================

    showToast(type, title, message) {
      if (window.showToast) {
        window.showToast(type, title, message)
      } else {
        alert(`${title}: ${message}`)
      }
    },
  },
}
</script>

<style scoped>
.user-management {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

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
  background: var(--badge-gradient);
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
  gap: 12px;
  align-items: center;
}

.btn-create {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(188, 31, 27, 0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(188, 31, 27, 0.4);
}

.btn-create svg {
  width: 18px;
  height: 18px;
}

.btn-refresh {
  width: 44px;
  height: 44px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: #f8fafc;
  border-color: #bc1f1b;
}

.btn-refresh svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.btn-refresh.rotating svg {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Estatísticas */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 2rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 24px;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stat-card.total {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  border: 2px solid #bc1f1b;
  box-shadow: 0 8px 25px rgba(188, 31, 27, 0.3);
}

.stat-card.pending {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  color: white;
  border: 2px solid #eab308;
  box-shadow: 0 8px 25px rgba(234, 179, 8, 0.3);
}

.stat-card.active {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: 2px solid #16a34a;
  box-shadow: 0 8px 25px rgba(22, 163, 74, 0.3);
}

.stat-card.blocked {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: 2px solid #dc2626;
  box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.stat-card:hover::after {
  left: 100%;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.2),
    0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
}

.stat-card:hover .stat-icon {
  transform: scale(1.15) rotate(-5deg);
  background: rgba(255, 255, 255, 0.3);
}

.stat-icon svg {
  width: 36px;
  height: 36px;
  stroke-width: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: countUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.95;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  line-height: 1;
}

.stat-bg-icon {
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 140px;
  height: 140px;
  opacity: 0.1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.stat-card:hover .stat-bg-icon {
  opacity: 0.15;
  transform: scale(1.1) rotate(10deg);
}

.stat-bg-icon svg {
  width: 100%;
  height: 100%;
  fill: white;
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

/* Modal Moderno */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modern-modal {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    transform: translateY(40px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
}

.modal-header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.modal-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(188, 31, 27, 0.3);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.modal-icon svg {
  width: 28px;
  height: 28px;
  color: white;
  stroke-width: 2.5;
}

.modal-title-wrapper h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2b2522;
  line-height: 1.3;
}

.modal-title-wrapper p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
}

.modal-close {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.modal-close:hover {
  background: rgba(188, 31, 27, 0.1);
  transform: rotate(90deg);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: color 0.3s;
}

.modal-close:hover svg {
  color: #bc1f1b;
}

.modal-body {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #2b2522;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label svg {
  width: 18px;
  height: 18px;
  color: #bc1f1b;
  stroke-width: 2;
}

.required {
  color: #bc1f1b;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
}

.form-input,
.form-select {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  color: #2b2522;
}

.form-input:hover,
.form-select:hover {
  border-color: #d1d5db;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #bc1f1b;
  box-shadow: 0 0 0 4px rgba(188, 31, 27, 0.1);
  transform: translateY(-1px);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.form-select {
  appearance: none;
  cursor: pointer;
  padding-right: 40px;
}

.select-arrow {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
  pointer-events: none;
  transition: all 0.3s;
}

.input-wrapper:hover .select-arrow {
  color: #bc1f1b;
}

.form-error {
  padding: 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid rgba(188, 31, 27, 0.3);
  border-radius: 12px;
  color: #bc1f1b;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  animation: shakeError 0.5s ease;
}

@keyframes shakeError {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.form-error svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  stroke-width: 2.5;
}

.modal-footer {
  padding: 24px 32px;
  border-top: 2px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-cancel svg {
  width: 18px;
  height: 18px;
}

.btn-submit {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  border: 2px solid transparent;
  box-shadow: 0 4px 15px rgba(188, 31, 27, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(188, 31, 27, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

  .stats-section {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 24px 20px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
  }

  .stat-icon svg {
    width: 32px;
    height: 32px;
  }

  .stat-number {
    font-size: 2.2rem;
  }

  .stat-label {
    font-size: 12px;
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

  .stats-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 20px 18px;
  }

  .stat-icon {
    width: 52px;
    height: 52px;
  }

  .stat-icon svg {
    width: 28px;
    height: 28px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-bg-icon {
    width: 120px;
    height: 120px;
    right: -15px;
    bottom: -15px;
  }

  .modern-modal {
    max-width: 95%;
    max-height: 95vh;
    border-radius: 16px;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-icon {
    width: 48px;
    height: 48px;
  }

  .modal-icon svg {
    width: 24px;
    height: 24px;
  }

  .modal-title-wrapper h2 {
    font-size: 20px;
  }

  .modal-title-wrapper p {
    font-size: 13px;
  }

  .modal-close {
    width: 36px;
    height: 36px;
  }

  .modal-body {
    padding: 20px;
  }

  .form-grid {
    gap: 20px;
  }

  .form-label {
    font-size: 13px;
  }

  .form-input,
  .form-select {
    padding: 12px 14px;
    font-size: 14px;
  }

  .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    justify-content: center;
    padding: 14px 20px;
  }
}
</style>
