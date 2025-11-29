<template>
  <div class="dependency-manager">
    <header class="dm-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">
            <svg
              class="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="12" cy="20" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="20" cy="12" r="2" />
              <line x1="12" y1="6" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="18" />
              <line x1="6" y1="12" x2="9" y2="12" />
              <line x1="15" y1="12" x2="18" y2="12" />
            </svg>
            Sistema de Dependências
          </h1>
          <span class="project-name">{{ projectName }}</span>
        </div>
        <div class="header-right">
          <button class="btn-icon" @click="refreshDependencies" :class="{ rotating: isRefreshing }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
          <button class="btn-primary" @click="openCreateModal">
            <svg
              class="btn-icon-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Criar Alteração
          </button>
        </div>
      </div>
    </header>

    <div class="search-filter-bar">
      <div class="search-box">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar alterações do sistema..."
          class="search-input"
        />
      </div>
      <div class="filter-chips">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="toggleFilter(filter.id)"
          class="filter-chip"
          :class="{ active: filter.active }"
        >
          {{ filter.label }}
        </button>
      </div>
      <div class="view-toggles">
        <button
          @click="viewMode = 'grid'"
          class="view-btn"
          :class="{ active: viewMode === 'grid' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          @click="viewMode = 'list'"
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="4" width="18" height="2" />
            <rect x="3" y="11" width="18" height="2" />
            <rect x="3" y="18" width="18" height="2" />
          </svg>
        </button>
        <button
          @click="viewMode = 'tree'"
          class="view-btn"
          :class="{ active: viewMode === 'tree' }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v10m0 0l-3-3m3 3l3-3" />
            <path d="M12 12v10" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="12" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
          </svg>
        </button>
      </div>
    </div>

    <div class="dependencies-container">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div> 
        <p>Carregando alterações...</p>
      </div>
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div
          v-for="dep in filteredDependencies"
          :key="dep.id"
          class="dep-card"
          @click="selectDependency(dep)"
          :class="{ selected: selectedDep?.id === dep.id }"
        >
          <div class="dep-card-header">
            <div class="dep-info">
              <h3 class="dep-name">{{ dep.titulo }}</h3>
              <!-- <p class="dep-version">{{ dep.versao }}</p> -->
            </div>
            <div class="dep-status" :class="getRiskClass(dep.nivel_impacto)">
              <span class="status-dot"></span>
              {{ dep.nivel_impacto }}
            </div>
          </div>
          <div class="dep-card-body">
            <p class="dep-description">{{ dep.descricao || 'Sem descrição disponível' }}</p>
            <div class="dep-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ formatDate(dep.criado_em) }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {{ formatDependencias(dep.qtd_itens) }}
              </span>
            </div>
          </div>
          <div class="dep-card-footer">
            <div class="dep-tags">
              <span class="tag">{{ getTabelaOrigem(dep) }}</span>
              <span class="tag">{{ dep.nome_criador }}</span>
            </div>
            <div class="dep-actions">
              <button class="action-btn" @click.stop="editDependency(dep)" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                </svg>
              </button>
              <button class="action-btn" @click.stop="removeDependency(dep)" title="Remover">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="viewMode === 'list'" class="list-view">
        <table class="dep-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Risco</th>
              <th>Data de criação</th>
              <th>Dependências</th>
              <th>Ações</th>
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
                <div class="package-cell">
                  <strong>{{ dep.titulo }}</strong>
                  <span class="package-desc">{{ dep.descricao || 'Sem descrição' }}</span>
                </div>
              </td>
              <!-- <td>{{ dep.versao }}</td> -->
              <td>
                <span class="status-badge" :class="getRiskClass(dep.nivel_impacto)">
                  {{ dep.nivel_impacto }}
                </span>
              </td>
              <td>{{ formatDate(dep.criado_em) }}</td>
              <td>{{ dep.qtd_itens }}</td>
              <td>
                <div class="table-actions">
                  <button class="action-btn" @click.stop="editDependency(dep)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button class="action-btn" @click.stop="removeDependency(dep)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

                  <span class="item-version">
                    {{ formatDependencias(item.qtd_itens) }}
                  </span>

                  <span class="status-badge" :class="getRiskClass(item.risco)">
                    {{ item.risco }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <VModal
      v-model="showAddModal"
      size="extra-large"
      background-color="white"
      :title="isEditing ? 'Editar Dependência' : 'Criar Dependência'"
      :show-footer="false"
      :show-confirm-button="false"
      :show-cancel-button="false"
    >
    
      <!-- CORPO -->
      <div class="modal-body">

        <!-- LINHA 1 - FORM -->
        <div class="header-wrapper">

          <!-- ESQUERDA -->
          <div class="left-block">

            <!-- Título -->
            <div class="input-block">
              <label class="input-label" for="titulo">Título</label>
              <input
                id="titulo"
                type="text"
                v-model="titulo"
                class="text-input"
                placeholder="Digite o título..."
              />
            </div>

            <!-- Seleção de Risco -->
            <div class="risk-block" role="group" aria-label="Selecione o risco">
              <div class="risk-title">Selecione o risco</div>

              <div class="risk-container">
                <button
                  type="button"
                  class="risk-card low"
                  :class="{ modalSelected: risco === 'Baixo' }"
                  @click="modal_setRisco('Baixo')"
                >
                  Baixo
                </button>

                <button
                  type="button"
                  class="risk-card medium"
                  :class="{ modalSelected: risco === 'Médio' }"
                  @click="modal_setRisco('Médio')"
                >
                  Médio
                </button>

                <button
                  type="button"
                  class="risk-card high"
                  :class="{ modalSelected: risco === 'Alto' }"
                  @click="modal_setRisco('Alto')"
                >
                  Alto
                </button>
              </div>
            </div>
          </div>

          <!-- DIREITA -->
          <div class="right-block">
            <label class="input-label" for="descricao">Descrição</label>
            <textarea
              id="descricao"
              v-model="descricao"
              class="text-area"
              placeholder="Descreva..."
            ></textarea>
          </div>

        </div>

        <!-- TÍTULO SEÇÃO -->
        <h3 class="section-title">
          {{ isChoosingPrincipal ? "Selecione o Item Principal" : "Selecione suas Dependências" }}
        </h3>

        <!-- TABELAS -->
        <div class="tables-wrapper">

          <div
            v-for="table in tablesData"
            :key="table.name"
            class="table-col"
          >
            <h4 class="table-title">{{ table.name }}</h4>

            <!-- bloco com scroll -->
            <div
              class="table-block"
              :data-table="table.name"
              :ref="el => tableRefs[table.name] = el"
            >

              <!-- itens -->
              <div
                v-for="item in modal_orderedItems(table)"
                :key="modal_makeKey(table, item)"
                :data-item="modal_makeKey(table, item)"
                class="dependency-item"
                :class="{
                  'principal-selected': modal_makeKey(table, item) === selectedPrincipalKey
                }"
              >

                <!-- ⭐ Item Principal Exibido -->
                <template v-if="!isChoosingPrincipal && modal_makeKey(table, item) === selectedPrincipalKey">
                  <div class="principal-container" @click="modal_trocarPrincipal()">
                    <div class="principal-line">
                      <span class="principal-star">⭐</span>
                      <span class="principal-name">{{ item.nome }}</span>
                    </div>

                    <div class="principal-action">
                      <span class="swap-icon">↺</span>
                      <span class="swap-text">Trocar item principal</span>
                    </div>
                  </div>
                </template>

                <!-- ETAPA 1 — Escolher principal -->
                <template v-else-if="isChoosingPrincipal">
                  <span class="modal-dep-name">{{ item.nome }}</span>

                  <input
                    type="radio"
                    class="principal-radio"
                    name="principal"
                    :value="modal_makeKey(table, item)"
                    @change="modal_confirmarPrincipal(modal_makeKey(table, item))"
                  />
                </template>

                <!-- ETAPA 2 — Dependências -->
                <template v-else>
                  <input
                    type="checkbox"
                    class="dep-checkbox"
                    :id="`dep-${table.name}-${item.id}`"
                    :value="modal_makeKey(table, item)"
                    :checked="selectedDependentesKeys.includes(modal_makeKey(table, item))"
                    :disabled="modal_makeKey(table, item) === selectedPrincipalKey"
                    @change="modal_toggleDependente(modal_makeKey(table, item))"
                  />

                  <label
                    :for="`dep-${table.name}-${item.id}`"
                    class="modal-dep-name"
                  >
                    {{ item.nome }}
                  </label>
                </template>

              </div>
              <!-- fim do dependency-item -->

            </div>
            <!-- fim do table-block -->

          </div>

        </div>
        <!-- fim tables-wrapper -->

      </div>
      <!-- fim modal-body -->

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal">Cancelar</button>
        <button class="btn-confirm" @click="modal_submitNew">Salvar</button>
      </div>

</VModal>



    <transition name="slide">
      <div v-if="selectedDep" class="sidebar">
        <div class="sidebar-header">
          <h2>{{ selectedDep.titulo }}</h2>
          <button class="sidebar-close" @click="selectedDep = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="sidebar-content">
          <div class="detail-section">
            <h3>Informações Gerais</h3>

            <div class="detail-row">
              <span class="detail-label">Risco:</span>
              <span class="status-badge" :class="getRiskClass(selectedDep.nivel_impacto)">
                {{ selectedDep.nivel_impacto }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Dependências:</span>
              <span class="detail-value">{{ formatDependencias(selectedDep.qtd_itens) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Detalhes</h3>
            <p class="detail-description">
              {{ selectedDep.descricao || 'Sem descrição disponível' }}
            </p>

            <div class="detail-row">
              <span class="detail-label">Data de criação:</span>
              <span class="detail-value">{{ formatDate(selectedDep.criado_em) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Criador:</span>
              <span class="detail-value">{{ selectedDep.criado_por_id }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Tabela de Origem:</span>
              <span class="detail-value">{{ getTabelaOrigem(selectedDep) }}</span>
            </div>
          </div>

          <div
            class="detail-section"
            v-if="selectedDep.itens && selectedDep.itens.length > 0"
          >
            <h3>Itens ({{ selectedDep.itens.length }})</h3>

            <div class="sub-dependencies">
              <div
                v-for="item in selectedDep.itens"
                :key="item.origem_id"
                class="sub-dep-item"
              >
                <strong>{{ item.titulo || 'Item sem nome' }}</strong>
                <small>{{ item.tabela }} - {{ item.origem_id }}</small>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Ações</h3>
            <div class="sidebar-actions">
              <button class="btn-primary full-width" @click="editDependency(selectedDep)">
                Editar Alteração
              </button>
              <button class="btn-danger full-width" @click="removeDependency(selectedDep)">
                Remover Alteração
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>


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
      projectName: 'JotaNunes Construtora',
      searchQuery: '',
      viewMode: 'grid',
      showAddModal: false,
      usuariosCache: {},
      form: {
        id: null,
        titulo: "",
        descricao: "",
        nivel_impacto: "",
        itens_dependentes: [],
        tabela_origem: "",
      },
      isEditing: false,
      selectedDep: null,
      isRefreshing: false,
      isLoading: true,
      isSaving: false,
      isConnected: false,
      editingDependency: null,
      unreadNotifications: 0,
      websocket: null,
      tipoMapa: {
        AUD_SQLS: 1,
        AUD_REPORTS: 2,
        AUD_FVS: 3
      },
      // --- MODAL NOVO ---
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
        { id: 'Baixo', label: 'Baixo', count: 0, active: false },
        { id: 'Médio', label: 'Médio', count: 0, active: false },
        { id: 'Alto', label: 'Alto', count: 0, active: false },
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
        {
          name: 'AUD_FVS',
          expanded: false,
          items: [],
        },
        {
          name: 'AUD_SQLS',
          expanded: false,
          items: [],
        },
        {
          name: 'AUD_REPORTS',
          expanded: false,
          items: [],
        },
      ],

      newDependency: {
        titulo: "",
        descricao: "",
        nivel_impacto_id: null,
        criado_por_id: null,
        itens: []
      },


      tabelasDisponiveis: ['AUD_FVS', 'AUD_SQLS', 'AUD_REPORTS'],
      itensOrigem: [],
      itensPorTabela: { AUD_FVS: [], AUD_SQLS: [], AUD_REPORTS: [] },
      depSelecionada: { fv: [], sql: [], report: [] }, // seleção múltipla por clique
      itens: [],
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
            // dep.criado_por_id.toLowerCase().includes(query),
            // dep.versao.toLowerCase().includes(query),
        )
      }

      // Apply risk filters
      const activeFilter = this.filters.find(f => f.active && f.id !== "all");

      if (activeFilter) {
        deps = deps.filter(dep => dep.risco === activeFilter.id);
      }


      return deps
    },
  },
  
  async mounted() {
    await this.initializeApp()
    // Atualiza o relógio a cada 60s para re-renderizar e recalcular textos relativos
    this._timeInterval = setInterval(() => {
      this.nowTick = Date.now()
    }, 60000)
  },  

  beforeUnmount() {
    if (this.websocket) {
      this.websocket.close()
    }
    if (this._timeInterval) clearInterval(this._timeInterval)
  },

  methods: {
    useFetch,
    async initializeApp() {
      try {
        await this.checkConnection()
        if (this.isConnected) {
          await Promise.all([
            this.loadDependencies(),
            this.loadNotifications(),
            this.connectWebSocket(),
          ])
        }
      } catch (error) {
        console.error('Initialization error:', error)
      }
    },

    async checkConnection() {
      try {
        await this.useFetch(`/health`)
        this.isConnected = true
      } catch (error) {
        this.isConnected = false
        // this.showToast('Erro de conexão com a API', 'error')
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
        
        // Agora já vem tudo completo no response
        this.dependencies = response.map(dep => {
          const risco = dep.nivel_impacto?.nivel || 'erro';

          return {
            id: dep.id,
            titulo: dep.titulo,
            descricao: dep.descricao,
            criado_por_id: dep.criado_por_id,
            nome_criador: null, // carregado separadamente se necessário
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
        console.log("DEPENDÊNCIAS RECEBIDAS:", this.dependencies);

        this.dependencies.forEach(dep => {
          console.log("DEP:", dep.id, "ITENS:", dep.itens);
          console.log("ITEM PRINCIPAL:", dep.itens.find(i => i.is_item_principal));
          console.log("TABELA ORIGEM:", this.getTabelaOrigem(dep));
        });

        console.log("CATEGORIAS DA ÁRVORE:", this.dependencyTree.map(c => c.name));
        this.organizeDependencyTree();
      } catch (error) {
        // this.showToast('Erro ao carregar alterações', 'error');
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },

    isItemSelected(tabela, id) {
      return this.newDependency.itens.some(
        it => it.tipo_item_id === this.tipoMapa[tabela] && it.origem_id == id
      );
    },

    toggleItem(tabela, item) {
      const tipo_item_id = this.tipoMapa[tabela];

      const existing = this.newDependency.itens.findIndex(
        it => it.tipo_item_id === tipo_item_id && it.origem_id == item.id
      );

      if (existing >= 0) {
        this.newDependency.itens.splice(existing, 1);
      } else {
        this.newDependency.itens.push({
          tipo_item_id,
          origem_id: item.id,
          is_item_principal: false
        });
      }
    },

    isPrincipal(tabela, id) {
      const tipo_item_id = this.tipoMapa[tabela];
      return this.newDependency.itens.some(
        it => it.tipo_item_id === tipo_item_id && it.origem_id == id && it.is_item_principal
      );
    },

    setPrincipal(tabela, id) {
      const tipo_item_id = this.tipoMapa[tabela];

      this.newDependency.itens.forEach(it => {
        if (it.tipo_item_id === tipo_item_id) {
          it.is_item_principal = it.origem_id == id;
        }
      });
    },

    async loadNotifications() {
      try {
        const response = await this.useFetch(`/notifications/count/unread`)
        this.unreadNotifications = response.unread_count
      } catch (error) {
        console.error('Load notifications error:', error)
      }
    },

    formatDependencias(qtd) {
      if (!qtd || qtd === 0) return "Nenhuma dependência";
      if (qtd === 1) return "1 Dependência";
      return `${qtd} Dependências`;
    },

    connectWebSocket() {
      try {
        const wsUrl = this.apiBaseUrl.replace('http', 'ws') + '/ws/notifications'
        this.websocket = new WebSocket(wsUrl)

        this.websocket.onopen = () => {
          console.log('WebSocket connected')
        }

        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.tabela && data.tabela.includes('ALTERACOES_SISTEMA')) {
            this.handleNotification(data)
          }
        }

        this.websocket.onclose = () => {
          console.log('WebSocket disconnected')
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            this.connectWebSocket()
          }, 5000)
        }
      } catch (error) {
        console.error('WebSocket connection error:', error)
      }
    },

    handleNotification(notification) {
      this.unreadNotifications++
      this.showToast(
        `Nova notificação: ${notification.dados?.acao || 'Alteração no sistema'}`,
        'info',
      )
      if (notification.dados?.acao) {
        this.loadDependencies()
      }
    },
    
    async refreshDependencies() {
      this.isRefreshing = true
      try {
        await Promise.all([
          this.loadDependencies(),
          this.loadNotifications(),
        ])
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
      document.body.setAttribute("data-risk", id === "all" ? "" : id);
    },

    selectDependency(dep) {
      if (this.selectedDep?.id === dep.id) {
        this.selectedDep = null
      } else {
        // Load full dependency details
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

      // preencher modal
      this.titulo = dep.titulo;
      this.descricao = dep.descricao;
      this.risco = dep.nivel_impacto || dep.nivel_impacto?.nivel || null;

      // NÃO dar reset aqui

      await this.modal_loadTables();

      const itens = dep.itens || [];

      // principal
      const principal = itens.find(i => i.is_item_principal);
      if (principal) {
        this.selectedPrincipalKey = `${principal.tabela}:${principal.origem_id}`;
        this.isChoosingPrincipal = false;
      }

      // dependentes
      this.selectedDependentesKeys = itens
        .filter(i => !i.is_item_principal)
        .map(i => `${i.tabela}:${i.origem_id}`);

      // abrir modal
      this.showAddModal = true;
    },



    getTabelaOrigem(dep) {
      if (!dep?.itens || dep.itens.length === 0) return "Sem origem";

      const principal = dep.itens.find(i => i.is_item_principal);
      return principal?.tabela || dep.itens[0]?.tabela || "Sem origem";
    },

    async removeDependency(dep) {
      if (!dep) return
      if (
        !confirm(
          `Remover definitivamente a alteração "${dep.titulo}" e tudo que foi criado no banco?`,
        )
      )
        return
      try {
        const usuario = prompt('Digite seu nome de usuário:')
        if (!usuario) return
        await this.useFetch(
          `/api/v2/dependencias/${dep.id}?usuario=${encodeURIComponent(usuario)}`,
          { method: 'DELETE' },
        )
        this.showToast('Dependência excluida!', 'success')
        await this.loadDependencies()
        this.selectedDep = null
      } catch (error) {
        this.showToast('Erro ao remover alteração', 'error')
        console.error('Remove dependency error:', error)
      }
    },

    async saveDependency(payload) {
      // payload vem do VModal

      // atualiza newDependency com os dados do payload
      this.newDependency = payload;

      if (!this.newDependency.titulo || !this.newDependency.descricao) {
        this.showToast('Preencha todos os campos obrigatórios', 'error');
        return;
      }

      this.isSaving = true;

      try {
        const payload = {
          titulo: this.newDependency.titulo,
          descricao: this.newDependency.descricao,
          nivel_impacto_id: this.newDependency.nivel_impacto_id,
          criado_por_id: this.newDependency.criado_por,
          itens: this.newDependency.itens.map(it => ({
            tipo_item_id: it.tipo_item_id,
            origem_id: it.origem_id,
            is_item_principal: it.is_item_principal
          }))
        };

        if (this.editingDependency) {
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

    async openCreateModal() {
      this.isEditing = false;
      this.editingDependency = null;

      // Reset do modal novo
      this.titulo = "";
      this.descricao = "";
      this.risco = null;

      this.isChoosingPrincipal = true;
      this.selectedPrincipalKey = null;
      this.selectedDependentesKeys = [];

      // abrir modal
      this.showAddModal = true;
    },
    toggleOption(tabela, idSel) {
      const tipoMapa = {
        AUD_SQLS: 1,
        AUD_REPORTS: 2,
        AUD_FVS: 3
      };

      const tipo_item_id = tipoMapa[tabela];
      const origem_id = String(idSel);

      // Verifica se já existe o item
      const index = this.newDependency.itens.findIndex(
        it => it.tipo_item_id === tipo_item_id && it.origem_id === origem_id
      );

      if (index >= 0) {
        // remover
        this.newDependency.itens.splice(index, 1);
      } else {
        // adicionar
        this.newDependency.itens.push({
          tipo_item_id,
          origem_id,
          is_item_principal: false
        });
      }
    },

    setPrincipal(tabela, idSel) {
      const tipoMapa = { AUD_SQLS: 1, AUD_REPORTS: 2, AUD_FVS: 3 };
      const tipo_item_id = tipoMapa[tabela];

      this.newDependency.itens.forEach(item => {
        if (item.tipo_item_id === tipo_item_id) {
          item.is_item_principal = (item.origem_id === String(idSel));
        }
      });
    },


    isSelected(tabela, idSel) {
      if (!this.newDependency || !this.newDependency.dependencias) return false
      const lista = this.newDependency.dependencias[tabela] || []
      return lista.includes(String(idSel))
    },



    limparSelecao() {
      this.depSelecionada = { fv: [], sql: [], report: [] }
    },

    // Regras de negócio: quais FVs aparecem na seleção
    availableOptions(tabela) {
      const list = this.itensPorTabela[tabela] || []
      if (tabela === 'AUD_FVS') {
        return list.filter((it) => {
          const ativo = it.ATIVO === true || it.ativo === true || it.ativo === 1
          const notSelf = !(
            this.newDependency.tabela_origem === 'AUD_FVS' && it.id === this.newDependency.origem_id
          )
          return ativo && notSelf
        })
      }
      return list
    },

    removerDependencia(index) {
      this.newDependency.dependencias.splice(index, 1)
    },

    async submitForm() {
      this.isSaving = true;

      const payload = {
        titulo: this.form.titulo,
        descricao: this.form.descricao,
        nivel_impacto_id: this.form.nivel_impacto,
        itens: this.form.itens_dependentes.map(id => ({
          origem_id: id
        }))
      };

      try {
        if (this.editingDependency) {
          await this.useFetch(`/api/v2/dependencias/${this.form.id}`, {
            method: "PUT",
            body: payload
          });
          this.showToast("Dependência atualizada!", "success");
        } else {
          await this.useFetch(`/api/v2/dependencias/`, {
            method: "POST",
            body: payload
          });
          this.showToast("Dependência criada!", "success");
        }

        this.showAddModal = false;
        await this.loadDependencies();
      
      } catch (error) {
        console.error(error);
        this.showToast("Erro ao salvar dependência", "error");
      }

      this.isSaving = false;
    },


    closeModal() {
      this.showAddModal = false
      this.editingDependency = null
      this.newDependency = {
        nome: '',
        versao: '',
        tabela_origem: '',
        origem_id: null, //  null em vez de string vazia
        criador: '',
        descricao: '',
        dependencias: [],
      }
      this.depSelecionada = { fv: [], sql: [], report: [] }
    },

    toggleCategory(category) {
      category.expanded = !category.expanded
    },

    organizeDependencyTree() {
      // Reset tree items
      this.dependencyTree.forEach((category) => {
        category.items = []
      })

      // Group dependencies by table origin
      this.dependencies.forEach((dep) => {
        const category = this.dependencyTree.find((cat) => cat.name === this.getTabelaOrigem(dep))
        if (category) {
          category.items.push(dep)
        } else {
          // Add to "Outros" category
          const otherCategory = this.dependencyTree.find((cat) => cat.name === 'Outros')
          if (otherCategory) {
            otherCategory.items.push(dep)
          }
        }
      })
    },

    updateRiskCounts() {
      const counts = { Baixo: 0, Médio: 0, Alto: 0 };

      this.dependencies.forEach(dep => {
        if (counts[dep.risco] !== undefined) {
          counts[dep.risco]++;
        }
      });

      // Atualiza os cards
      this.stats.distribuicao_risco = counts;

      // Atualiza os chips
      this.filters.find(f => f.id === "Baixo").count = counts.Baixo;
      this.filters.find(f => f.id === "Médio").count = counts.Médio;
      this.filters.find(f => f.id === "Alto").count = counts.Alto;

      // Total (chip "Todos")
      this.filters.find(f => f.id === "all").count = this.dependencies.length;
    },


    getRiskClass(risco) {
      const riskClasses = {
        'Sem risco': 'sem-risco',
        Baixo: 'baixo',
        Médio: 'medio',
        Alto: 'alto',
      }
      return riskClasses[risco] || 'baixo'
    },

    formatDate(input) {
      // Referência para forçar re-render quando nowTick muda
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
    // =============================
    // === MODAL — NOVO SISTEMA ===
    // =============================

    // Selecionar risco
    modal_setRisco(r) {
      this.risco = r;
    },

    // Chave única para identificar itens
    modal_makeKey(table, item) {
      return `${table.name}:${item.id}`;
    },


    // Ordenar itens: principal → dependentes → restantes
    modal_orderedItems(table) {
      const items = table.items || [];

      return [
        // principal
        ...items.filter(i => this.modal_makeKey(table, i) === this.selectedPrincipalKey),

        // dependentes
        ...items.filter(i =>
          this.selectedDependentesKeys.includes(this.modal_makeKey(table, i))
        ),

        // restantes
        ...items.filter(i =>
          this.modal_makeKey(table, i) !== this.selectedPrincipalKey &&
          !this.selectedDependentesKeys.includes(this.modal_makeKey(table, i))
        )
      ];
    },

    // Confirmar item principal
    modal_confirmarPrincipal(key) {
      this.selectedPrincipalKey = key;
      this.isChoosingPrincipal = false;

      // Remover dependente que virou principal
      this.selectedDependentesKeys = this.selectedDependentesKeys.filter(k => k !== key);

      // Scroll para topo da coluna
      const [tableName] = key.split(":");
      const el = this.tableRefs[tableName];
      if (el) {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    // Trocar item principal
    modal_trocarPrincipal() {
      this.isChoosingPrincipal = true;
      this.selectedPrincipalKey = null;
    },

    // Selecionar / deselecionar dependente
    modal_toggleDependente(key) {
      // Não marca o principal
      if (key === this.selectedPrincipalKey) return;

      if (this.selectedDependentesKeys.includes(key)) {
        this.selectedDependentesKeys =
          this.selectedDependentesKeys.filter(k => k !== key);
      } else {
        this.selectedDependentesKeys.push(key);
      }

      // Scroll para topo da coluna
      const [tableName] = key.split(":");
      const el = this.tableRefs[tableName];
      if (el) {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    // Buscar itens de cada tabela
    async modal_fetchItems(tabela) {
      try {
        return await this.useFetch(`/api/v2/dependencias/itens/${tabela}`);
      } catch (e) {
        console.error("Erro ao buscar itens:", e);
        return [];
      }
    },

    // Carregar lista de tabelas + itens
    async modal_loadTables() {
      try {
        // Tipos de itens: retorna lista com { id, tabela }
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

    // Converter nome da tabela -> tipo_item_id
    modal_tipoItemIdPorTabela(nomeTabela) {
      const found = this.tiposItens.find(t => t.tabela === nomeTabela);
      return found ? found.id : null;
    },

    // Converter risco → nível de impacto da API
    modal_riscoParaImpacto(r) {
      return {
        "Baixo": 1,
        "Médio": 2,
        "Alto": 3
      }[r] || null;
    },

    // Montar payload para salvar no backend
    modal_buildPayload() {
      const itens = [];

      // Item principal
      if (this.selectedPrincipalKey) {
        const [tabela, id] = this.selectedPrincipalKey.split(":");

        itens.push({
          tipo_item_id: this.modal_tipoItemIdPorTabela(tabela),
          origem_id: id,
          is_item_principal: true
        });
      }

      // Dependentes
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

      if (this.isEditing && this.editingDependency) {
        await this.saveDependency({
          ...payload,
          id: this.editingDependency.id
        });
      } else {
        await this.saveDependency(payload);
      }
    },

  },
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dependency-manager {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Header */
.dm-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.app-title .icon {
  width: 28px;
  height: 28px;
  color: #6366f1;
}

.project-name {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.btn-icon svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.btn-icon.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon-sm {
  width: 16px;
  height: 16px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Search and Filter Bar */
.search-filter-bar {
  background: white;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box input, ::placeholder{
  color: black;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filter-chips {
  display: flex;
  gap: 0.75rem;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-chip:hover {
  background: #f8fafc;
}

.filter-chip.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.chip-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.view-toggles {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: #f1f5f9;
  border-radius: 8px;
}

.view-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background: white;
}

.view-btn.active {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-btn svg {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.view-btn.active svg {
  color: #6366f1;
}

/* Dependencies Container */
.dependencies-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  min-height: 400px;
}

/* Grid View */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.dep-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.dep-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.dep-card.selected {
  border-color: #6366f1;
}

.dep-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.dep-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.dep-version {
  font-size: 0.875rem;
  color: #64748b;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.dep-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap; /* Para resolver quebra que deixa feio */
}

.dep-status.sem-risco {
  background: #f0f9ff;
  color: #0369a1;
}

.dep-status.baixo {
  background: #dcfce7;
  color: #166534;
}

.dep-status.medio {
  background: #fed7aa;
  color: #9a3412;
}

.dep-status.alto {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dep-card-body {
  margin-bottom: 1rem;
}

.dep-description {
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dep-meta {
  display: flex;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.dep-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.dep-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.625rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.dep-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
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

.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.action-btn svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

/* List View */
.list-view {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dep-table {
  width: 100%;
  border-collapse: collapse;
}

.dep-table thead {
  background: #f8fafc;
}

.dep-table th {
  text-align: left;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.dep-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.dep-table tbody tr:hover {
  background: #f8fafc;
}

.dep-table tbody tr.selected {
  background: #f0f9ff;
}

.dep-table td {
  padding: 1rem 1.5rem;
}

.package-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.package-desc {
  font-size: 0.75rem;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap; /* Resolvendo quebra chata */
}

.status-badge.sem-risco {
  background: #f0f9ff;
  color: #0369a1;
}

.status-badge.baixo {
  background: #dcfce7;
  color: #166534;
}

.status-badge.medio {
  background: #fed7aa;
  color: #9a3412;
}

.status-badge.alto {
  background: #fee2e2;
  color: #991b1b;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

/* Tree View */
.tree-view {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tree-category {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.2s;
}

.category-header:hover {
  background: #f1f5f9;
}

.chevron {
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: transform 0.2s;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.category-name {
  flex: 1;
  font-weight: 600;
  color: #1a202c;
}

.category-count {
  padding: 0.125rem 0.5rem;
  background: #e2e8f0;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.category-items {
  padding: 0.5rem;
}

.tree-item {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tree-item:hover {
  background: #f8fafc;
}

.tree-item.selected {
  background: #f0f9ff;
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-name {
  flex: 1;
  font-weight: 500;
  color: #1a202c;
}

.item-version {
  color: #64748b;
  font-size: 0.875rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: white;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  color: #1a202c;
}

.sidebar-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.sidebar-close:hover {
  background: #f1f5f9;
}

.sidebar-close svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 2rem;
  border: 0; 
  /* Tirei essa borda */
}

.detail-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  color: #64748b;
  font-size: 0.875rem;
}

.detail-value {
  color: #1a202c;
  font-weight: 500;
}

.detail-description {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding: 0.2rem;
}

.sub-dependencies {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-dep-item {
  padding: 0.625rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #475569;
}

.sub-dep-item strong {
  display: block;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.sub-dep-item small {
  color: #64748b;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.full-width {
  width: 100%;
}

.btn-danger {
  padding: 0.625rem 1.25rem;
  border: 1px solid #fee2e2;
  background: white;
  color: #ef4444;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #fee2e2;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  max-width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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

.toast.success {
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left: 4px solid #ef4444;
}

.toast.info {
  border-left: 4px solid #6366f1;
}

.toast-content {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.toast-message {
  color: #1a202c;
  font-size: 0.875rem;
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  margin-left: 1rem;
}

.toast-close:hover {
  color: #1a202c;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.btn-remove:hover {
  background: #c82333;
}

/* ----------------------- */
/* --------------------------
   OVERLAY & CONTAINER
---------------------------*/
/* BODY SCROLL */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 30px;
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
}

.modal-title {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin: 0;
  color: #111;
}

/* --------------------------
      HEADER (Título/Risco/Desc)
---------------------------*/
.header-wrapper {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 40px;
  align-items: center;
}

.left-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-block {
  display: flex;
  flex-direction: column;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.text-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d5d5d5;
  background: #fafafa;
  font-size: 14px;
}

.text-area {
  min-height: 130px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d5d5d5;
  font-size: 14px;
  resize: vertical;
}

/* --------------------------
      RISCO – Grupo conectado
---------------------------*/
.risk-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.risk-title {
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin-bottom: 8px;
}

.risk-container {
  display: inline-flex;
  gap: 2px;
}

.risk-card {
  padding: 10px 28px;
  min-width: 98px;
  text-align: center;
  border: none;
  border-radius: 4px;
  background: #5151512e;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background, border-radius .10s ease;
}

.risk-card.low:hover:not(.modalSelected) { background: #6EE7B7; border-radius: 12px; }
.risk-card.medium:hover:not(.modalSelected) { background: #FDE047; border-radius: 12px; }
.risk-card.high:hover:not(.modalSelected) { background: #F87171; border-radius: 12px; }

.risk-card.low.modalSelected { background: #34D399; border-radius: 24px; }
.risk-card.medium.modalSelected { background: #FACC15; border-radius: 24px; }
.risk-card.high.modalSelected { background: #EF4444; border-radius: 24px; }

/* --------------------------
        SECTION TITLE
---------------------------*/
.section-title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin: 0;
  color: #111;
}

/* --------------------------
        TABLES (Colunas)
---------------------------*/
.tables-wrapper {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

.table-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  gap: 10px;
}

.table-title {
  font-size: 20px;
  font-weight: 500;
  color: #111;
  margin: 0;
  text-align: center;
}

.table-block {
  width: 300px;
  height: 370px;
  border-radius: 5px;
  background: #efefef;
  overflow-y: auto;
}

/* Scrollbar minimalista */
.table-block::-webkit-scrollbar {
  width: 4px;       /* Largura sutil */
}

.table-block::-webkit-scrollbar-track {
  background: transparent;   /* Sem bloco cinza */
}

.table-block::-webkit-scrollbar-thumb {
  background: rgba(1, 1, 1, 0.31);    /* Cor discreta */
  border-radius: 20px;                      /* Bordinha suave */
}

.table-block::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);    /* Um pouco mais forte no hover */
}


/* --------------------------
   DEPENDENCY ITEM (Geral)
---------------------------*/
.dependency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 300px;
  gap: 12px;
  padding: 12px;
  height: auto;
  min-height: 75px;
  border-bottom: solid 3px #ddd;
  color: #111;
}

/* NOME */
.modal-dep-name {
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --------------------------
     ETAPA 1 – RADIO BUTTON
---------------------------*/
.principal-radio {
  appearance: none;
  -webkit-appearance: none;
  min-width: 22px;
  min-height: 22px;
  border-radius: 50%;
  border: 3px solid #888;
  cursor: pointer;
  transition: all .15s ease;
}

.principal-radio:hover {
  border-color: #5b2ccc;
}

.principal-radio:checked {
  background: #6f39ef;
  border-color: #6f39ef;
  box-shadow: inset 0 0 0 4px #fff;
}


/* --------------------------
 ETAPA 2 – CHECKBOX DAS DEPENDÊNCIAS
---------------------------*/
.dep-checkbox {
  appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid gray;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s ease;
}

.dep-checkbox:hover {
  border-color: #5b2ccc;
  background: #f3eaff;
}

.dep-checkbox:checked {
  background: #6f39ef;
  border-color: #6f39ef;
}

.dep-checkbox:checked::after {
  content: "✔";
  color: white;
  font-size: 14px;
  font-weight: bold;
}
.input-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* --------------------------
    ITEM PRINCIPAL (selecionado)
---------------------------*/
.principal-selected {
  background: #d1fae5 !important;
  border-left: 5px solid #10b981;
  /* border-radius: 10px; */
  padding-left: 8px;
}

/* Container interno do principal */
.principal-container {
  /* background: #d1fae5;               */
  /* border-left: 5px solid #10b981;  */
  border-radius: 12px;

  padding: 12px;
  width: 100%;          
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  gap: 8px;

  cursor: pointer;
}

.principal-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.principal-star {
  font-size: 22px;
  flex-shrink: 0;
}

.principal-name {
  font-weight: 700;
  font-size: 16px;
  color: #111;
  /* limitar em 3 linhas igual ao dep-name */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.principal-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0f766e;
  font-size: 14px;
  font-weight: 600;
}

.swap-icon {
  font-size: 16px;
}

.swap-text {
  text-decoration: underline;
}

/* --------------------------
       FOOTER
---------------------------*/
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f1f1f1;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-weight: 700;
  cursor: pointer;
}

.btn-confirm {
  padding: 10px 26px;
  background: #6f39ef;
  color: #fff;
  border-radius: 12px;
  border: none;
  font-weight: 800;
  cursor: pointer;
}

</style>
