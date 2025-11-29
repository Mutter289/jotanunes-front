<template>
  <div class="dependencies">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>Gestão de Dependências</h1>
        <p>Gerencie alterações do sistema e suas interdependências</p>
      </div>
      <div class="header-actions">
        <button class="btn-create" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Dependência
        </button>
        <button
          class="btn-refresh"
          @click="refreshDependencies"
          :class="{ rotating: isRefreshing }"
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

    <!-- Filter Tabs -->
    <div class="table-filter-container">
      <div class="filter-tabs">
        <button
          v-for="filter in filters"
          :key="filter.id"
          :class="['filter-tab', { active: filter.active }]"
          @click="toggleFilter(filter.id)"
        >
          <div class="tab-icon" v-html="getFilterIcon(filter.id)"></div>
          <div class="tab-content">
            <span class="tab-title">{{ filter.label }}</span>
            <span class="tab-subtitle">{{ filter.count }} {{ filter.count === 1 ? 'item' : 'itens' }}</span>
          </div>
          <div v-if="filter.active" class="tab-active-indicator">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      <!-- View Mode Toggles -->
      <div class="view-modes">
        <button
          @click="viewMode = 'grid'"
          :class="['view-mode-btn', { active: viewMode === 'grid' }]"
          title="Visualização em Grade"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button
          @click="viewMode = 'list'"
          :class="['view-mode-btn', { active: viewMode === 'list' }]"
          title="Visualização em Lista"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="4" width="18" height="2" rx="1" />
            <rect x="3" y="11" width="18" height="2" rx="1" />
            <rect x="3" y="18" width="18" height="2" rx="1" />
          </svg>
        </button>
        <button
          @click="viewMode = 'tree'"
          :class="['view-mode-btn', { active: viewMode === 'tree' }]"
          title="Visualização em Árvore"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="2" />
            <line x1="12" y1="7" x2="12" y2="12" />
            <line x1="12" y1="12" x2="7" y2="17" />
            <line x1="12" y1="12" x2="17" y2="17" />
            <circle cx="7" cy="19" r="2" />
            <circle cx="17" cy="19" r="2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por título, descrição ou criador..."
        class="search-input"
      />
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando dependências...</p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div
          v-for="dep in filteredDependencies"
          :key="dep.id"
          class="dependency-card"
          @click="selectDependency(dep)"
          :class="{ selected: selectedDep?.id === dep.id }"
        >
          <div class="card-header">
            <div class="card-title-area">
              <h3 class="card-title">{{ dep.titulo }}</h3>
            </div>
            <div class="risk-badge" :class="getRiskClass(dep.nivel_impacto)">
              <span class="badge-dot"></span>
              {{ dep.nivel_impacto }}
            </div>
          </div>

          <div class="card-body">
            <p class="card-description">{{ dep.descricao || 'Sem descrição disponível' }}</p>

            <div class="card-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ formatDate(dep.criado_em) }}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {{ formatDependencias(dep.qtd_itens) }}
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="card-tags">
              <span class="tag tag-table">{{ getTabelaOrigem(dep) }}</span>
              <span class="tag tag-user">{{ dep.nome_criador }}</span>
            </div>
            <div class="card-actions">
              <button class="action-btn" @click.stop="editDependency(dep)" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                </svg>
              </button>
              <button class="action-btn action-btn-danger" @click.stop="removeDependency(dep)" title="Remover">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else-if="viewMode === 'list'" class="list-view">
        <div class="table-wrapper">
          <table class="dependencies-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Nível de Impacto</th>
                <th>Data de Criação</th>
                <th>Dependências</th>
                <th>Origem</th>
                <th class="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dep in filteredDependencies"
                :key="dep.id"
                @click="selectDependency(dep)"
                :class="{ selected: selectedDep?.id === dep.id }"
              >
                <td>
                  <div class="table-title-cell">
                    <strong>{{ dep.titulo }}</strong>
                    <span class="table-description">{{ dep.descricao || 'Sem descrição' }}</span>
                  </div>
                </td>
                <td>
                  <span class="risk-badge-sm" :class="getRiskClass(dep.nivel_impacto)">
                    {{ dep.nivel_impacto }}
                  </span>
                </td>
                <td>{{ formatDate(dep.criado_em) }}</td>
                <td>{{ dep.qtd_itens }}</td>
                <td>
                  <span class="table-tag">{{ getTabelaOrigem(dep) }}</span>
                </td>
                <td class="actions-column">
                  <div class="table-actions">
                    <button class="action-btn-sm" @click.stop="editDependency(dep)" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                    </button>
                    <button class="action-btn-sm action-btn-danger" @click.stop="removeDependency(dep)" title="Remover">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tree View -->
      <div v-else-if="viewMode === 'tree'" class="tree-view">
        <div class="tree-container">
          <div v-for="category in dependencyTree" :key="category.name" class="tree-category">
            <div class="category-header" @click="toggleCategory(category)">
              <svg
                class="chevron"
                :class="{ expanded: category.expanded }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">{{ category.items.length }}</span>
            </div>
            <div v-if="category.expanded" class="category-items">
              <div
                v-for="item in category.items"
                :key="item.id"
                class="tree-item"
                @click="selectDependency(item)"
                :class="{ selected: selectedDep?.id === item.id }"
              >
                <div class="tree-item-content">
                  <span class="item-name">{{ item.titulo }}</span>
                  <span class="item-meta">{{ formatDependencias(item.qtd_itens) }}</span>
                  <span class="risk-badge-sm" :class="getRiskClass(item.nivel_impacto)">
                    {{ item.nivel_impacto }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <VModal
      v-model="showAddModal"
      size="extra-large"
      background-color="white"
      :title="isEditing ? 'Editar Dependência' : 'Criar Dependência'"
      :show-footer="false"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
      <div class="modal-body">
        <!-- Header Section -->
        <div class="modal-header-section">
          <div class="modal-left-block">
            <!-- Título -->
            <div class="modal-input-group">
              <label class="modal-label" for="titulo">Título da Dependência</label>
              <input
                id="titulo"
                type="text"
                v-model="titulo"
                class="modal-input"
                placeholder="Ex: Atualização do módulo financeiro..."
              />
            </div>

            <!-- Nível de Impacto -->
            <div class="modal-risk-section">
              <label class="modal-label">Nível de Impacto</label>
              <div class="modal-risk-options">
                <button
                  type="button"
                  class="risk-option risk-low"
                  :class="{ selected: risco === 'Baixo' }"
                  @click="modal_setRisco('Baixo')"
                >
                  <span class="risk-dot"></span>
                  Baixo
                </button>
                <button
                  type="button"
                  class="risk-option risk-medium"
                  :class="{ selected: risco === 'Médio' }"
                  @click="modal_setRisco('Médio')"
                >
                  <span class="risk-dot"></span>
                  Médio
                </button>
                <button
                  type="button"
                  class="risk-option risk-high"
                  :class="{ selected: risco === 'Alto' }"
                  @click="modal_setRisco('Alto')"
                >
                  <span class="risk-dot"></span>
                  Alto
                </button>
              </div>
            </div>
          </div>

          <div class="modal-right-block">
            <label class="modal-label" for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="descricao"
              class="modal-textarea"
              placeholder="Descreva a alteração e seu impacto no sistema..."
            ></textarea>
          </div>
        </div>

        <!-- Section Title -->
        <h3 class="modal-section-title">
          {{ isChoosingPrincipal ? "Selecione o Item Principal" : "Selecione as Dependências" }}
        </h3>

        <!-- Tables Section -->
        <div class="modal-tables-wrapper">
          <div
            v-for="table in tablesData"
            :key="table.name"
            class="modal-table-column"
          >
            <h4 class="modal-table-title">{{ table.name }}</h4>
            <div
              class="modal-table-list"
              :ref="el => tableRefs[table.name] = el"
            >
              <div
                v-for="item in modal_orderedItems(table)"
                :key="modal_makeKey(table, item)"
                class="modal-dependency-item"
                :class="{
                  'principal-selected': modal_makeKey(table, item) === selectedPrincipalKey
                }"
              >
                <!-- Principal Item Display -->
                <template v-if="!isChoosingPrincipal && modal_makeKey(table, item) === selectedPrincipalKey">
                  <div class="modal-principal-container" @click="modal_trocarPrincipal()">
                    <div class="modal-principal-line">
                      <span class="modal-principal-star">⭐</span>
                      <span class="modal-principal-name">{{ item.nome }}</span>
                    </div>
                    <div class="modal-principal-action">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      </svg>
                      <span>Trocar item principal</span>
                    </div>
                  </div>
                </template>

                <!-- Step 1: Choose Principal -->
                <template v-else-if="isChoosingPrincipal">
                  <span class="modal-item-name">{{ item.nome }}</span>
                  <input
                    type="radio"
                    class="modal-radio"
                    name="principal"
                    :value="modal_makeKey(table, item)"
                    @change="modal_confirmarPrincipal(modal_makeKey(table, item))"
                  />
                </template>

                <!-- Step 2: Choose Dependencies -->
                <template v-else>
                  <input
                    type="checkbox"
                    class="modal-checkbox"
                    :id="`dep-${table.name}-${item.id}`"
                    :value="modal_makeKey(table, item)"
                    :checked="selectedDependentesKeys.includes(modal_makeKey(table, item))"
                    :disabled="modal_makeKey(table, item) === selectedPrincipalKey"
                    @change="modal_toggleDependente(modal_makeKey(table, item))"
                  />
                  <label
                    :for="`dep-${table.name}-${item.id}`"
                    class="modal-item-name"
                  >
                    {{ item.nome }}
                  </label>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="modal-btn-cancel" @click="closeModal">Cancelar</button>
        <button class="modal-btn-confirm" @click="modal_submitNew">Salvar Dependência</button>
      </div>
    </VModal>

    <!-- Offcanvas Sidebar -->
    <transition name="slide">
      <div v-if="selectedDep" class="offcanvas-sidebar">
        <div class="offcanvas-header">
          <h2>{{ selectedDep.titulo }}</h2>
          <button class="offcanvas-close" @click="selectedDep = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="offcanvas-content">
          <!-- General Info -->
          <div class="offcanvas-section">
            <h3 class="section-title">Informações Gerais</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Nível de Impacto:</label>
                <span class="risk-badge-sm" :class="getRiskClass(selectedDep.nivel_impacto)">
                  {{ selectedDep.nivel_impacto }}
                </span>
              </div>
              <div class="detail-item">
                <label>Dependências:</label>
                <span>{{ formatDependencias(selectedDep.qtd_itens) }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="offcanvas-section">
            <h3 class="section-title">Descrição</h3>
            <p class="detail-description">
              {{ selectedDep.descricao || 'Sem descrição disponível' }}
            </p>
          </div>

          <!-- Details -->
          <div class="offcanvas-section">
            <h3 class="section-title">Detalhes</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Data de Criação:</label>
                <span>{{ formatDate(selectedDep.criado_em) }}</span>
              </div>
              <div class="detail-item">
                <label>Criador:</label>
                <span>{{ selectedDep.criado_por_id }}</span>
              </div>
              <div class="detail-item">
                <label>Tabela de Origem:</label>
                <span>{{ getTabelaOrigem(selectedDep) }}</span>
              </div>
            </div>
          </div>

          <!-- Items List -->
          <div class="offcanvas-section" v-if="selectedDep.itens && selectedDep.itens.length > 0">
            <h3 class="section-title">Itens Vinculados ({{ selectedDep.itens.length }})</h3>
            <div class="items-list">
              <div
                v-for="item in selectedDep.itens"
                :key="item.origem_id"
                class="item-card"
              >
                <div class="item-header">
                  <strong>{{ item.titulo || 'Item sem nome' }}</strong>
                  <span v-if="item.is_item_principal" class="principal-badge">Principal</span>
                </div>
                <small>{{ item.tabela }} - ID: {{ item.origem_id }}</small>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="offcanvas-section">
            <h3 class="section-title">Ações</h3>
            <div class="offcanvas-actions">
              <button class="btn-action-primary" @click="editDependency(selectedDep)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                </svg>
                Editar Dependência
              </button>
              <button class="btn-action-danger" @click="removeDependency(selectedDep)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Remover Dependência
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast Container -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <div class="toast-content">
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="removeToast(toast.id)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useFetch } from '@/hooks/useFetch.js'
import VModal from '@/components/Modal/VModal.vue'

export default {
  components: {
    VModal
  },
  watch: {
    showAddModal(val) {
      if (val) {
        console.log("MODAL ABRIU — carregando tabelas…");
        this.modal_loadTables();
      }
    }
  },
  data() {
    return {
      searchQuery: '',
      viewMode: 'grid',
      showAddModal: false,
      usuariosCache: {},
      isEditing: false,
      selectedDep: null,
      isRefreshing: false,
      isLoading: true,
      isSaving: false,
      editingDependency: null,
      tipoMapa: {
        AUD_SQLS: 1,
        AUD_REPORTS: 2,
        AUD_FVS: 3
      },

      // Modal data
      titulo: "",
      descricao: "",
      risco: null,
      isChoosingPrincipal: true,
      selectedPrincipalKey: null,
      selectedDependentesKeys: [],
      tablesData: [],
      tiposItens: [],
      tableRefs: {},

      filters: [
        { id: 'all', label: 'Todos', count: 0, active: true },
        { id: 'Baixo', label: 'Baixo Impacto', count: 0, active: false },
        { id: 'Médio', label: 'Médio Impacto', count: 0, active: false },
        { id: 'Alto', label: 'Alto Impacto', count: 0, active: false },
      ],

      stats: {
        total_dependencias: 0,
        distribuicao_risco: {
          Baixo: 0,
          Médio: 0,
          Alto: 0,
        },
      },

      dependencies: [],

      dependencyTree: [
        { name: 'AUD_FVS', expanded: false, items: [] },
        { name: 'AUD_SQLS', expanded: false, items: [] },
        { name: 'AUD_REPORTS', expanded: false, items: [] },
      ],

      tabelasDisponiveis: ['AUD_FVS', 'AUD_SQLS', 'AUD_REPORTS'],
      toasts: [],
      nowTick: Date.now(),
    }
  },

  computed: {
    filteredDependencies() {
      let deps = [...this.dependencies]

      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        deps = deps.filter(
          (dep) =>
            dep.titulo.toLowerCase().includes(query) ||
            (dep.descricao && dep.descricao.toLowerCase().includes(query)),
        )
      }

      // Apply risk filters
      const activeFilter = this.filters.find(f => f.active && f.id !== "all");
      if (activeFilter) {
        deps = deps.filter(dep => dep.nivel_impacto === activeFilter.id);
      }

      return deps
    },
  },

  async mounted() {
    await this.initializeApp()
    this._timeInterval = setInterval(() => {
      this.nowTick = Date.now()
    }, 60000)
  },

  beforeUnmount() {
    if (this._timeInterval) clearInterval(this._timeInterval)
  },

  methods: {
    useFetch,

    async initializeApp() {
      try {
        await this.loadDependencies()
      } catch (error) {
        console.error('Initialization error:', error)
      }
    },

    async fetchUsuarioPorId(id) {
      if (this.usuariosCache[id]) return this.usuariosCache[id];

      try {
        const usuario = await this.useFetch(`/api/auth/admin/usuarios/${id}`);
        this.usuariosCache[id] = usuario.nome;
        return usuario.nome;
      } catch {
        return `${id}`;
      }
    },

    async loadDependencies() {
      try {
        this.isLoading = true;
        const response = await this.useFetch(`/api/v2/dependencias/`);

        this.dependencies = response.map(dep => {
          const risco = dep.nivel_impacto?.nivel || 'Baixo';

          return {
            id: dep.id,
            titulo: dep.titulo,
            descricao: dep.descricao,
            criado_por_id: dep.criado_por_id,
            nome_criador: null,
            criado_em: dep.criado_em,
            nivel_impacto: dep.nivel_impacto?.nivel,
            nivel_impacto_id: dep.nivel_impacto_id,
            risco,
            itens: dep.itens || [],
            qtd_itens: dep.itens?.length ?? 0
          };
        });

        for (const dep of this.dependencies) {
          dep.nome_criador = await this.fetchUsuarioPorId(dep.criado_por_id);
        }

        this.stats.total_dependencias = this.dependencies.length;
        this.updateRiskCounts();
        this.organizeDependencyTree();
      } catch (error) {
        console.error(error);
        this.showToast('Erro ao carregar dependências', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    formatDependencias(qtd) {
      if (!qtd || qtd === 0) return "Nenhuma dependência";
      if (qtd === 1) return "1 Dependência";
      return `${qtd} Dependências`;
    },

    async refreshDependencies() {
      this.isRefreshing = true
      try {
        await this.loadDependencies()
        this.showToast('Dados atualizados com sucesso', 'success')
      } catch (error) {
        this.showToast('Erro ao atualizar dados', 'error')
      } finally {
        this.isRefreshing = false
      }
    },

    toggleFilter(filterId) {
      this.filters.forEach((filter) => {
        filter.active = filter.id === filterId
      })
    },

    selectDependency(dep) {
      if (this.selectedDep?.id === dep.id) {
        this.selectedDep = null
      } else {
        this.loadDependencyDetails(dep.id)
      }
    },

    async loadDependencyDetails(id) {
      try {
        const dep = await this.useFetch(`/api/v2/dependencias/${id}`);

        this.selectedDep = {
          id: dep.id,
          titulo: dep.titulo,
          descricao: dep.descricao,
          nivel_impacto_id: dep.nivel_impacto_id,
          nivel_impacto: dep.nivel_impacto?.nivel,
          criado_por_id: dep.criado_por_id,
          criado_em: dep.criado_em,
          itens: dep.itens || [],
          qtd_itens: dep.itens?.length ?? 0
        };
      } catch (error) {
        this.showToast('Erro ao carregar detalhes', 'error');
        console.error(error);
      }
    },

    async editDependency(dep) {
      console.log("EDITANDO:", dep);
      this.isEditing = true;
      this.editingDependency = dep;

      this.titulo = dep.titulo;
      this.descricao = dep.descricao;
      this.risco = dep.nivel_impacto || dep.nivel_impacto?.nivel || null;

      await this.modal_loadTables();

      const itens = dep.itens || [];

      const principal = itens.find(i => i.is_item_principal);
      if (principal) {
        this.selectedPrincipalKey = `${principal.tabela}:${principal.origem_id}`;
        this.isChoosingPrincipal = false;
      }

      this.selectedDependentesKeys = itens
        .filter(i => !i.is_item_principal)
        .map(i => `${i.tabela}:${i.origem_id}`);

      this.showAddModal = true;
    },

    getTabelaOrigem(dep) {
      if (!dep?.itens || dep.itens.length === 0) return "Sem origem";
      const principal = dep.itens.find(i => i.is_item_principal);
      return principal?.tabela || dep.itens[0]?.tabela || "Sem origem";
    },

    async removeDependency(dep) {
      if (!dep) return
      if (!confirm(`Remover definitivamente a alteração "${dep.titulo}"?`)) return

      try {
        const usuario = prompt('Digite seu nome de usuário:')
        if (!usuario) return

        await this.useFetch(
          `/api/v2/dependencias/${dep.id}?usuario=${encodeURIComponent(usuario)}`,
          { method: 'DELETE' },
        )
        this.showToast('Dependência excluída!', 'success')
        await this.loadDependencies()
        this.selectedDep = null
      } catch (error) {
        this.showToast('Erro ao remover dependência', 'error')
        console.error('Remove dependency error:', error)
      }
    },

    async openCreateModal() {
      this.isEditing = false;
      this.editingDependency = null;

      this.titulo = "";
      this.descricao = "";
      this.risco = null;

      this.isChoosingPrincipal = true;
      this.selectedPrincipalKey = null;
      this.selectedDependentesKeys = [];

      this.showAddModal = true;
    },

    closeModal() {
      this.showAddModal = false
      this.editingDependency = null
    },

    toggleCategory(category) {
      category.expanded = !category.expanded
    },

    organizeDependencyTree() {
      this.dependencyTree.forEach((category) => {
        category.items = []
      })

      this.dependencies.forEach((dep) => {
        const category = this.dependencyTree.find((cat) => cat.name === this.getTabelaOrigem(dep))
        if (category) {
          category.items.push(dep)
        }
      })
    },

    updateRiskCounts() {
      const counts = { Baixo: 0, Médio: 0, Alto: 0 };

      this.dependencies.forEach(dep => {
        if (counts[dep.nivel_impacto] !== undefined) {
          counts[dep.nivel_impacto]++;
        }
      });

      this.stats.distribuicao_risco = counts;
      this.filters.find(f => f.id === "Baixo").count = counts.Baixo;
      this.filters.find(f => f.id === "Médio").count = counts.Médio;
      this.filters.find(f => f.id === "Alto").count = counts.Alto;
      this.filters.find(f => f.id === "all").count = this.dependencies.length;
    },

    getRiskClass(risco) {
      const riskClasses = {
        'Baixo': 'baixo',
        'Médio': 'medio',
        'Alto': 'alto',
      }
      return riskClasses[risco] || 'baixo'
    },

    getFilterIcon(filterId) {
      const icons = {
        all: `<svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>`,
        Baixo: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm0 5l7 13H5l7-13z"/>
        </svg>`,
        Médio: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>`,
        Alto: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>`
      }
      return icons[filterId] || icons.all
    },

    formatDate(input) {
      void this.nowTick
      if (!input) return 'N/A'
      const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input
      if (Number.isNaN(d.getTime())) return 'N/A'

      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)

      const pad = (n) => String(n).padStart(2, '0')
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`

      const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
      const todayStart = startOfDay(now).getTime()
      const dateStart = startOfDay(d).getTime()
      const dayDiff = Math.round((todayStart - dateStart) / (24 * 60 * 60 * 1000))

      if (diffSec < 30) return 'agora'
      if (diffMin < 60) return `há ${diffMin} min`
      if (dayDiff === 0) return `hoje ${timeStr}`
      if (dayDiff === 1) return `ontem ${timeStr}`
      if (dayDiff > 1 && dayDiff < 7) {
        return d.toLocaleDateString('pt-BR', { weekday: 'long' }) + ` ${timeStr}`
      }
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    },

    showToast(message, type = 'info') {
      const toast = {
        id: Date.now(),
        message,
        type,
      }
      this.toasts.push(toast)
      setTimeout(() => {
        this.removeToast(toast.id)
      }, 5000)
    },

    removeToast(id) {
      const index = this.toasts.findIndex((toast) => toast.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    },

    // Modal methods
    modal_setRisco(r) {
      this.risco = r;
    },

    modal_makeKey(table, item) {
      return `${table.name}:${item.id}`;
    },

    modal_orderedItems(table) {
      const items = table.items || [];
      return [
        ...items.filter(i => this.modal_makeKey(table, i) === this.selectedPrincipalKey),
        ...items.filter(i =>
          this.selectedDependentesKeys.includes(this.modal_makeKey(table, i))
        ),
        ...items.filter(i =>
          this.modal_makeKey(table, i) !== this.selectedPrincipalKey &&
          !this.selectedDependentesKeys.includes(this.modal_makeKey(table, i))
        )
      ];
    },

    modal_confirmarPrincipal(key) {
      this.selectedPrincipalKey = key;
      this.isChoosingPrincipal = false;
      this.selectedDependentesKeys = this.selectedDependentesKeys.filter(k => k !== key);

      const [tableName] = key.split(":");
      const el = this.tableRefs[tableName];
      if (el) {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    modal_trocarPrincipal() {
      this.isChoosingPrincipal = true;
      this.selectedPrincipalKey = null;
    },

    modal_toggleDependente(key) {
      if (key === this.selectedPrincipalKey) return;

      if (this.selectedDependentesKeys.includes(key)) {
        this.selectedDependentesKeys = this.selectedDependentesKeys.filter(k => k !== key);
      } else {
        this.selectedDependentesKeys.push(key);
      }

      const [tableName] = key.split(":");
      const el = this.tableRefs[tableName];
      if (el) {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    async modal_fetchItems(tabela) {
      try {
        return await this.useFetch(`/api/v2/dependencias/itens/${tabela}`);
      } catch (e) {
        console.error("Erro ao buscar itens:", e);
        return [];
      }
    },

    async modal_loadTables() {
      try {
        this.tiposItens = await this.useFetch("/api/v2/dependencias/lista-tabelas");
        const arr = [];

        for (const tabela of this.tabelasDisponiveis) {
          const items = await this.modal_fetchItems(tabela);
          arr.push({ name: tabela, items });
        }

        this.tablesData = arr;
      } catch (e) {
        console.error("Erro ao carregar tabelas:", e);
      }
    },

    modal_tipoItemIdPorTabela(nomeTabela) {
      const found = this.tiposItens.find(t => t.tabela === nomeTabela);
      return found ? found.id : null;
    },

    modal_riscoParaImpacto(r) {
      return {
        "Baixo": 1,
        "Médio": 2,
        "Alto": 3
      }[r] || null;
    },

    modal_buildPayload() {
      const itens = [];

      if (this.selectedPrincipalKey) {
        const [tabela, id] = this.selectedPrincipalKey.split(":");
        itens.push({
          tipo_item_id: this.modal_tipoItemIdPorTabela(tabela),
          origem_id: id,
          is_item_principal: true
        });
      }

      for (const key of this.selectedDependentesKeys) {
        const [tabela, id] = key.split(":");
        itens.push({
          tipo_item_id: this.modal_tipoItemIdPorTabela(tabela),
          origem_id: id,
          is_item_principal: false
        });
      }

      return {
        titulo: this.titulo,
        descricao: this.descricao,
        nivel_impacto_id: this.modal_riscoParaImpacto(this.risco),
        itens
      };
    },

    async modal_submitNew() {
      const payload = this.modal_buildPayload();

      if (!payload.titulo || !payload.descricao || !payload.nivel_impacto_id) {
        this.showToast('Preencha todos os campos obrigatórios', 'error');
        return;
      }

      this.isSaving = true;

      try {
        if (this.isEditing && this.editingDependency) {
          await this.useFetch(`/api/v2/dependencias/${this.editingDependency.id}`, {
            method: "PUT",
            body: payload
          });
          this.showToast('Dependência atualizada!', 'success');
        } else {
          await this.useFetch(`/api/v2/dependencias/`, {
            method: "POST",
            body: payload
          });
          this.showToast('Dependência criada!', 'success');
        }

        await this.loadDependencies();
        this.closeModal();
      } catch (e) {
        this.showToast('Erro ao salvar dependência', 'error');
        console.error(e);
      } finally {
        this.isSaving = false;
      }
    },
  },
}
</script>

<style scoped>
/* Global Styles */
.dependencies {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
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

/* Filter Tabs Container */
.table-filter-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  flex: 1;
}

.filter-tab {
  position: relative;
  background: #ffffff;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  color: #495057;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(188, 31, 27, 0.05), transparent);
  transition: left 0.5s;
}

.filter-tab:hover::before {
  left: 100%;
}

.filter-tab:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12), 0 0 20px rgba(188, 31, 27, 0.1);
  border-color: rgba(188, 31, 27, 0.3);
  color: #bc1f1b;
}

.filter-tab.active {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  border-color: #bc1f1b;
  color: #ffffff;
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 12px 40px rgba(188, 31, 27, 0.35), 0 0 0 3px rgba(188, 31, 27, 0.15);
  animation: tabActivate 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tabActivate {
  0% { transform: translateY(-4px) scale(1); }
  50% { transform: translateY(-4px) scale(1.06); }
  100% { transform: translateY(-4px) scale(1.03); }
}

.tab-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-icon svg {
  width: 100%;
  height: 100%;
}

.filter-tab:hover .tab-icon {
  transform: scale(1.15) rotate(5deg);
}

.filter-tab.active .tab-icon {
  animation: iconPulse 0.6s ease-out;
  color: #ffffff;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  30% { transform: scale(1.3) rotate(-10deg); }
  60% { transform: scale(0.9) rotate(5deg); }
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tab-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.tab-subtitle {
  font-size: 11px;
  opacity: 0.85;
  font-weight: 500;
}

.filter-tab.active .tab-subtitle {
  opacity: 0.95;
}

.tab-active-indicator {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bc1f1b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: checkmarkAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-active-indicator svg {
  width: 16px;
  height: 16px;
  animation: checkmarkDraw 0.4s ease-out;
}

@keyframes checkmarkAppear {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* View Modes */
.view-modes {
  display: flex;
  gap: 8px;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 10px;
}

.view-mode-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.view-mode-btn:hover {
  background: white;
  transform: scale(1.05);
}

.view-mode-btn.active {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  box-shadow: 0 4px 12px rgba(188, 31, 27, 0.3);
}

.view-mode-btn svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.view-mode-btn.active svg {
  color: white;
}

/* Search Container */
.search-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
}

.search-container:focus-within {
  border-color: #bc1f1b;
  box-shadow: 0 0 0 3px rgba(188, 31, 27, 0.1);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1e293b;
}

.search-input::placeholder {
  color: #94a3b8;
}

/* Content Area */
.content-area {
  min-height: 400px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #bc1f1b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 14px;
}

/* Grid View */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.dependency-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dependency-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(188, 31, 27, 0.3);
}

.dependency-card.selected {
  border-color: #bc1f1b;
  box-shadow: 0 0 0 3px rgba(188, 31, 27, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.risk-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.risk-badge.baixo {
  background: #dcfce7;
  color: #166534;
}

.risk-badge.medio {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge.alto {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  margin-bottom: 16px;
}

.card-description {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: scale(1.05);
}

.action-btn svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.action-btn-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.action-btn-danger:hover svg {
  color: #dc2626;
}

/* List View */
.list-view {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-wrapper {
  overflow-x: auto;
}

.dependencies-table {
  width: 100%;
  border-collapse: collapse;
}

.dependencies-table thead {
  background: #f8fafc;
}

.dependencies-table th {
  text-align: left;
  padding: 16px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}

.dependencies-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}

.dependencies-table tbody tr:hover {
  background: #f8fafc;
}

.dependencies-table tbody tr.selected {
  background: #fef2f2;
  border-left: 4px solid #bc1f1b;
}

.dependencies-table td {
  padding: 16px;
  font-size: 14px;
  color: #1e293b;
}

.table-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-title-cell strong {
  font-weight: 600;
  color: #1e293b;
}

.table-description {
  font-size: 12px;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.risk-badge-sm {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  text-transform: uppercase;
}

.risk-badge-sm.baixo {
  background: #dcfce7;
  color: #166534;
}

.risk-badge-sm.medio {
  background: #fef3c7;
  color: #92400e;
}

.risk-badge-sm.alto {
  background: #fee2e2;
  color: #991b1b;
}

.table-tag {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.actions-column {
  width: 120px;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn-sm {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-sm:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.action-btn-sm svg {
  width: 14px;
  height: 14px;
  color: #64748b;
}

.action-btn-sm.action-btn-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.action-btn-sm.action-btn-danger:hover svg {
  color: #dc2626;
}

/* Tree View */
.tree-view {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tree-category {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.category-header:hover {
  background: #f1f5f9;
}

.chevron {
  width: 18px;
  height: 18px;
  color: #64748b;
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.category-name {
  flex: 1;
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
}

.category-count {
  padding: 4px 10px;
  background: #e2e8f0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.category-items {
  padding: 8px;
}

.tree-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.tree-item:hover {
  background: #f8fafc;
}

.tree-item.selected {
  background: #fef2f2;
  border-left: 4px solid #bc1f1b;
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
}

.item-meta {
  color: #64748b;
  font-size: 13px;
}

/* Modal Styles */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 30px;
  overflow-y: auto;
  padding-right: 6px;
}

.modal-header-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.modal-left-block,
.modal-right-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.3s;
}

.modal-input:focus {
  outline: none;
  border-color: #bc1f1b;
  box-shadow: 0 0 0 3px rgba(188, 31, 27, 0.1);
}

.modal-textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s;
}

.modal-textarea:focus {
  outline: none;
  border-color: #bc1f1b;
  box-shadow: 0 0 0 3px rgba(188, 31, 27, 0.1);
}

.modal-risk-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-risk-options {
  display: flex;
  gap: 8px;
}

.risk-option {
  flex: 1;
  padding: 14px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
}

.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.risk-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-option.risk-low {
  color: #166534;
}

.risk-option.risk-low:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.risk-option.risk-low.selected {
  background: #dcfce7;
  border-color: #16a34a;
}

.risk-option.risk-medium {
  color: #92400e;
}

.risk-option.risk-medium:hover {
  background: #fef3c7;
  border-color: #fde047;
}

.risk-option.risk-medium.selected {
  background: #fef3c7;
  border-color: #ca8a04;
}

.risk-option.risk-high {
  color: #991b1b;
}

.risk-option.risk-high:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.risk-option.risk-high.selected {
  background: #fee2e2;
  border-color: #dc2626;
}

.modal-section-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1e293b;
  margin: 0;
}

.modal-tables-wrapper {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.modal-table-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  max-width: 320px;
}

.modal-table-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin: 0;
}

.modal-table-list {
  max-height: 400px;
  overflow-y: auto;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

.modal-table-list::-webkit-scrollbar {
  width: 6px;
}

.modal-table-list::-webkit-scrollbar-track {
  background: transparent;
}

.modal-table-list::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 10px;
}

.modal-dependency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.modal-dependency-item:last-child {
  border-bottom: none;
}

.modal-dependency-item:hover {
  background: white;
}

.modal-dependency-item.principal-selected {
  background: #d1fae5;
  border-left: 4px solid #10b981;
}

.modal-item-name {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-radio {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-radio:hover {
  border-color: #bc1f1b;
}

.modal-radio:checked {
  background: #bc1f1b;
  border-color: #bc1f1b;
  box-shadow: inset 0 0 0 4px white;
}

.modal-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-checkbox:hover {
  border-color: #bc1f1b;
  background: #fef2f2;
}

.modal-checkbox:checked {
  background: #bc1f1b;
  border-color: #bc1f1b;
}

.modal-checkbox:checked::after {
  content: "✔";
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.modal-principal-container {
  width: 100%;
  padding: 12px;
  background: #d1fae5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-principal-container:hover {
  background: #a7f3d0;
}

.modal-principal-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.modal-principal-star {
  font-size: 20px;
}

.modal-principal-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.modal-principal-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-size: 12px;
  font-weight: 600;
}

.modal-principal-action svg {
  width: 14px;
  height: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.modal-btn-cancel {
  padding: 12px 24px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-cancel:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.modal-btn-confirm {
  padding: 12px 28px;
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(188, 31, 27, 0.3);
}

.modal-btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(188, 31, 27, 0.4);
}

/* Offcanvas Sidebar */
.offcanvas-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 450px;
  background: white;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.15);
  z-index: 999;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.offcanvas-header {
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #2b2522 0%, #1a1715 100%);
  color: white;
}

.offcanvas-header h2 {
  font-size: 20px;
  margin: 0;
}

.offcanvas-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.offcanvas-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.offcanvas-close svg {
  width: 20px;
  height: 20px;
  color: white;
}

.offcanvas-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.offcanvas-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 14px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.detail-item label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.detail-item span {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.detail-description {
  color: #475569;
  line-height: 1.7;
  font-size: 14px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-header strong {
  color: #1e293b;
  font-size: 14px;
}

.principal-badge {
  padding: 4px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.item-card small {
  color: #64748b;
  font-size: 12px;
}

.offcanvas-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-action-primary,
.btn-action-danger {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-action-primary {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(188, 31, 27, 0.3);
}

.btn-action-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(188, 31, 27, 0.4);
}

.btn-action-primary svg {
  width: 18px;
  height: 18px;
}

.btn-action-danger {
  background: white;
  color: #dc2626;
  border: 2px solid #fee2e2;
}

.btn-action-danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.btn-action-danger svg {
  width: 18px;
  height: 18px;
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  min-width: 320px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideInRight 0.3s ease-out;
  overflow: hidden;
}

.toast.success {
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.info {
  border-left: 4px solid #3b82f6;
}

.toast-content {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.toast-message {
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.toast-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* Responsive */
@media (max-width: 1200px) {
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .dependencies {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .filter-tabs {
    grid-template-columns: 1fr;
  }

  .table-filter-container {
    flex-direction: column;
  }

  .grid-view {
    grid-template-columns: 1fr;
  }

  .modal-header-section {
    grid-template-columns: 1fr;
  }

  .modal-tables-wrapper {
    flex-direction: column;
  }

  .offcanvas-sidebar {
    width: 100%;
  }
}
</style>
