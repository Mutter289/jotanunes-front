<template>
  <div class="dependency-manager">
    <!-- Header Section -->
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
          <div
            class="connection-status"
            :class="{ connected: isConnected, disconnected: !isConnected }"
          >
            <span class="status-dot"></span>
            {{ isConnected ? 'Conectado' : 'Desconectado' }}
          </div>
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

    <!-- Search and Filter Bar -->
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
          <span class="chip-count">{{ filter.count }}</span>
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

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.total_alteracoes }}</h3>
          <p class="stat-label">Total de Alterações</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.total_dependencias }}</h3>
          <p class="stat-label">Total de Dependências</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stats.distribuicao_risco?.Alto || 0 }}</h3>
          <p class="stat-label">Risco Alto</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ unreadNotifications }}</h3>
          <p class="stat-label">Notificações</p>
        </div>
      </div>
    </div>

    <!-- Dependencies View -->
    <div class="dependencies-container">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Carregando alterações...</p>
      </div>

      <!-- Grid View -->
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
              <h3 class="dep-name">{{ dep.nome }}</h3>
              <p class="dep-version">{{ dep.versao }}</p>
            </div>
            <div class="dep-status" :class="getRiskClass(dep.risco)">
              <span class="status-dot"></span>
              {{ dep.risco }}
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
                {{ formatDate(dep.ultima_atu) }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                {{ dep.qtd_dependencias }} deps
              </span>
            </div>
          </div>
          <div class="dep-card-footer">
            <div class="dep-tags">
              <span class="tag">{{ dep.tabela_origem }}</span>
              <span class="tag">{{ dep.criador }}</span>
            </div>
            <div class="dep-actions">
              <button class="action-btn" @click.stop="openDiagram(dep)" title="Abrir Diagrama">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <path d="M10 6h4" />
                  <rect x="14" y="5" width="7" height="9" />
                  <path d="M14 10h-4" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M10 18h4M18 14v7" />
                </svg>
              </button>
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

      <!-- List View -->
      <div v-else-if="viewMode === 'list'" class="list-view">
        <table class="dep-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Versão</th>
              <th>Risco</th>
              <th>Última Atualização</th>
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
                  <strong>{{ dep.nome }}</strong>
                  <span class="package-desc">{{ dep.descricao || 'Sem descrição' }}</span>
                </div>
              </td>
              <td>{{ dep.versao }}</td>
              <td>
                <span class="status-badge" :class="getRiskClass(dep.risco)">
                  {{ dep.risco }}
                </span>
              </td>
              <td>{{ formatDate(dep.ultima_atu) }}</td>
              <td>{{ dep.qtd_dependencias }}</td>
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
                  <span class="item-name">{{ item.nome }}</span>
                  <span class="item-version">{{ item.versao }}</span>
                  <span class="status-indicator" :class="getRiskClass(item.risco)"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingDependency ? 'Editar Alteração' : 'Nova Alteração do Sistema' }}</h2>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nome da Alteração</label>
            <input
              v-model="newDependency.nome"
              type="text"
              placeholder="Nome da alteração no sistema"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Versão</label>
            <input
              v-model="newDependency.versao"
              type="text"
              placeholder="v1.0.0"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Tabela de Origem</label>
            <select
              v-model="newDependency.tabela_origem"
              class="form-select"
              @change="loadOrigemItens"
            >
              <option v-for="t in tabelasDisponiveis" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Item de Origem</label>
            <select v-model="newDependency.id_origem" class="form-select">
              <option v-for="it in itensOrigem" :key="it.id" :value="it.id">{{ it.nome }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Criador</label>
            <input
              v-model="newDependency.criador"
              type="text"
              placeholder="Nome do usuário"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea
              v-model="newDependency.descricao"
              placeholder="Descrição detalhada da alteração"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Dependências (Forma Visual → SQL → Relatório)</label>
            <div class="dep-chooser">
              <div class="dep-chooser-col" v-if="newDependency.tabela_origem !== 'AUD_FV'">
                <small>Forma Visual</small>
                <select
                  v-model="depSelecionada.fv"
                  class="form-select"
                  @focus="ensureItens('AUD_FV')"
                >
                  <option value="">Selecione uma Forma Visual</option>
                  <option v-for="fv in itensPorTabela.AUD_FV" :key="fv.id" :value="fv.id">
                    {{ fv.nome }}
                  </option>
                </select>
              </div>
              <div class="dep-chooser-col" v-if="newDependency.tabela_origem !== 'AUD_SQLS'">
                <small>SQL</small>
                <select
                  v-model="depSelecionada.sql"
                  class="form-select"
                  @focus="ensureItens('AUD_SQLS')"
                >
                  <option value="">Selecione um SQL</option>
                  <option v-for="s in itensPorTabela.AUD_SQLS" :key="s.id" :value="s.id">
                    {{ s.nome }}
                  </option>
                </select>
              </div>
              <div class="dep-chooser-col" v-if="newDependency.tabela_origem !== 'AUD_REPORT'">
                <small>Relatório</small>
                <select
                  v-model="depSelecionada.report"
                  class="form-select"
                  @focus="ensureItens('AUD_REPORT')"
                >
                  <option value="">Selecione um Relatório</option>
                  <option v-for="r in itensPorTabela.AUD_REPORT" :key="r.id" :value="r.id">
                    {{ r.nome }}
                  </option>
                </select>
              </div>
              <button class="btn-secondary" @click="adicionarSequencia">Adicionar Sequência</button>
            </div>
            <div v-if="newDependency.dependencias.length" class="sequencias-list">
              <div v-for="(d, i) in newDependency.dependencias" :key="i" class="sequencia-item">
                <div class="sequencia-info">
                  <span class="sequencia-tabela">{{ d.tabela_dependente }}</span>
                  <span class="sequencia-item">{{ d.nome_dependente || d.id_dependente }}</span>
                  <button class="btn-remove" @click="removerDependencia(i)">×</button>
                </div>
                <div v-if="d.observacoes" class="sequencia-observacoes">
                  <small><strong>Observações:</strong> {{ d.observacoes }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Campo de Observações para Dependências -->
          <div class="form-group" v-if="newDependency.dependencias.length > 0">
            <label>Observações das Dependências</label>
            <textarea
              v-model="observacoesDependencias"
              placeholder="Observações gerais sobre as dependências selecionadas"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancelar</button>
          <button class="btn-primary" @click="saveDependency" :disabled="isSaving">
            {{ isSaving ? 'Salvando...' : editingDependency ? 'Atualizar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Diagram Modal -->
    <div v-if="showDiagram" class="modal-overlay" @click.self="showDiagram = false">
      <div class="modal large-modal">
        <div class="modal-header">
          <h2>Diagrama de Dependências: {{ diagramData?.nome }}</h2>
          <button class="modal-close" @click="showDiagram = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="diagram-container">
            <div v-if="mermaidDiagram" v-html="mermaidDiagram"></div>
            <div v-else class="loading-diagram">
              <div class="spinner"></div>
              <p>Gerando diagrama...</p>
            </div>
          </div>
          <div v-if="diagramData?.dependencias?.length" class="diagram-details">
            <h3>Detalhes das Dependências</h3>
            <ul class="diagram-list">
              <li v-for="d in diagramData.dependencias" :key="d.id" class="diagram-item">
                <strong>{{ d.tabela_dependente }}:</strong>
                {{ d.nome_dependente || d.id_dependente }}
                <span v-if="d.observacoes" class="observacoes">({{ d.observacoes }})</span>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDiagram = false">Fechar</button>
          <button class="btn-primary" @click="downloadDiagram">Download PNG</button>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <transition name="slide">
      <div v-if="selectedDep" class="sidebar">
        <div class="sidebar-header">
          <h2>{{ selectedDep.nome }}</h2>
          <button class="sidebar-close" @click="selectedDep = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="sidebar-content">
          <div class="detail-section">
            <h3>Informações da Versão</h3>
            <div class="detail-row">
              <span class="detail-label">Versão Atual:</span>
              <span class="detail-value">{{ selectedDep.versao }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Risco:</span>
              <span class="status-badge" :class="getRiskClass(selectedDep.risco)">{{
                selectedDep.risco
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dependências:</span>
              <span class="detail-value">{{ selectedDep.qtd_dependencias }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Detalhes</h3>
            <p class="detail-description">
              {{ selectedDep.descricao || 'Sem descrição disponível' }}
            </p>
            <div class="detail-row">
              <span class="detail-label">Última Atualização:</span>
              <span class="detail-value">{{ formatDate(selectedDep.ultima_atu) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Criador:</span>
              <span class="detail-value">{{ selectedDep.criador }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tabela de Origem:</span>
              <span class="detail-value">{{ selectedDep.tabela_origem }}</span>
            </div>
          </div>

          <div
            class="detail-section"
            v-if="selectedDep.dependencias && selectedDep.dependencias.length > 0"
          >
            <h3>Dependências ({{ selectedDep.dependencias.length }})</h3>
            <div class="sub-dependencies">
              <div v-for="subDep in selectedDep.dependencias" :key="subDep.id" class="sub-dep-item">
                <strong>{{ subDep.nome || 'Dependência sem nome' }}</strong>
                <small>por {{ subDep.criador }} - {{ formatDate(subDep.ultima_atu) }}</small>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Ações</h3>
            <div class="sidebar-actions">
              <button class="btn-primary full-width" @click="editDependency(selectedDep)">
                Editar Alteração
              </button>
              <button class="btn-secondary full-width" @click="viewHistory(selectedDep)">
                Ver Histórico
              </button>
              <button class="btn-danger full-width" @click="removeDependency(selectedDep)">
                Remover Alteração
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast Notifications -->
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

export default {
  data() {
    return {
      projectName: 'JotaNunes Construtora',
      searchQuery: '',
      viewMode: 'grid',
      showAddModal: false,
      selectedDep: null,
      isRefreshing: false,
      isLoading: true,
      isSaving: false,
      isConnected: false,
      editingDependency: null,
      unreadNotifications: 0,
      websocket: null,
      showDiagram: false,
      diagramData: null,

      filters: [
        { id: 'all', label: 'Todos', count: 0, active: true },
        { id: 'Sem risco', label: 'Sem Risco', count: 0, active: false },
        { id: 'Baixo', label: 'Baixo', count: 0, active: false },
        { id: 'Médio', label: 'Médio', count: 0, active: false },
        { id: 'Alto', label: 'Alto', count: 0, active: false },
      ],

      stats: {
        total_alteracoes: 0,
        total_dependencias: 0,
        distribuicao_risco: {
          'Sem risco': 0,
          Baixo: 0,
          Médio: 0,
          Alto: 0,
        },
      },

      dependencies: [],

      dependencyTree: [
        {
          name: 'AUD_FV',
          expanded: true,
          items: [],
        },
        {
          name: 'AUD_SQL',
          expanded: true,
          items: [],
        },
        {
          name: 'AUD_REPORTS',
          expanded: false,
          items: [],
        },
        {
          name: 'Outros',
          expanded: false,
          items: [],
        },
      ],

      newDependency: {
        nome: '',
        versao: '',
        tabela_origem: 'AUD_FV',
        id_origem: null,
        criador: '',
        descricao: '',
        dependencias: [],
      },

      tabelasDisponiveis: ['AUD_FV', 'AUD_SQL', 'AUD_REPORT'],
      itensOrigem: [],
      itensPorTabela: { AUD_FV: [], AUD_SQL: [], AUD_REPORT: [] },
      depSelecionada: { fv: null, sql: null, report: null },
      observacoesDependencias: '',

      toasts: [],
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
            dep.nome.toLowerCase().includes(query) ||
            (dep.descricao && dep.descricao.toLowerCase().includes(query)) ||
            dep.criador.toLowerCase().includes(query) ||
            dep.versao.toLowerCase().includes(query),
        )
      }

      // Apply risk filters
      const activeFilter = this.filters.find((f) => f.active && f.id !== 'all')
      if (activeFilter) {
        deps = deps.filter((dep) => dep.risco === activeFilter.id)
      }

      return deps
    },
  },

  async mounted() {
    await this.initializeApp()
  },

  beforeUnmount() {
    if (this.websocket) {
      this.websocket.close()
    }
  },

  methods: {
    useFetch,
    async initializeApp() {
      try {
        await this.checkConnection()
        if (this.isConnected) {
          await Promise.all([
            this.loadDependencies(),
            this.loadStatistics(),
            this.loadNotifications(),
            this.connectWebSocket(),
          ])
        }
      } catch (error) {
        this.showToast('Erro ao inicializar aplicação', 'error')
        console.error('Initialization error:', error)
      }
    },

    async checkConnection() {
      try {
        await this.useFetch(`/health`)
        this.isConnected = true
      } catch (error) {
        this.isConnected = false
        this.showToast('Erro de conexão com a API', 'error')
      }
    },

    async loadDependencies() {
      try {
        this.isLoading = true
        const response = await this.useFetch(`/api/v2/dependencias/itens`)
        this.dependencies = response
        this.updateFilterCounts()
        this.organizeDependencyTree()
      } catch (error) {
        this.showToast('Erro ao carregar alterações', 'error')
        console.error('Load dependencies error:', error)
      } finally {
        this.isLoading = false
      }
    },

    async loadStatistics() {
      try {
        const response = await this.useFetch(`/api/v2/dependencias/estatisticas`)
        this.stats = response
      } catch (error) {
        console.error('Load statistics error:', error)
      }
    },

    async loadNotifications() {
      try {
        const response = await this.useFetch(`/notifications/count/unread`)
        this.unreadNotifications = response.unread_count
      } catch (error) {
        console.error('Load notifications error:', error)
      }
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
      // Reload dependencies if it's a system change
      if (notification.dados?.acao) {
        this.loadDependencies()
      }
    },

    async refreshDependencies() {
      this.isRefreshing = true
      try {
        await Promise.all([
          this.loadDependencies(),
          this.loadStatistics(),
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
        const response = await this.useFetch(`/api/v2/dependencias/itens/${id}`)
        this.selectedDep = response
      } catch (error) {
        this.showToast('Erro ao carregar detalhes da alteração', 'error')
      }
    },

    editDependency(dep) {
      this.editingDependency = dep
      this.newDependency = {
        nome: dep.nome,
        versao: dep.versao,
        tabela_origem: dep.tabela_origem,
        criador: dep.criador,
        descricao: dep.descricao || '',
        dependencias: [],
      }
      this.showAddModal = true
    },

    async removeDependency(dep) {
      if (confirm(`Tem certeza que deseja remover a alteração "${dep.nome}"?`)) {
        try {
          const usuario = prompt('Digite seu nome de usuário:')
          if (!usuario) return

          await this.useFetch(
            `/api/v2/dependencias/itens/${dep.id}?usuario=${encodeURIComponent(usuario)}`,
            {
              method: 'DELETE',
            },
          )

          await this.loadDependencies()
          this.selectedDep = null
          this.showToast('Alteração removida com sucesso', 'success')
        } catch (error) {
          this.showToast('Erro ao remover alteração', 'error')
          console.error('Remove dependency error:', error)
        }
      }
    },

    async saveDependency() {
      if (
        !this.newDependency.nome ||
        !this.newDependency.versao ||
        !this.newDependency.criador ||
        !this.newDependency.id_origem
      ) {
        this.showToast('Preencha todos os campos obrigatórios', 'error')
        return
      }

      this.isSaving = true
      try {
        if (this.editingDependency) {
          // Update existing dependency
          const usuario = this.newDependency.criador
          await this.useFetch(
            `/api/v2/dependencias/itens/${this.editingDependency.id}?usuario=${encodeURIComponent(usuario)}`,
            {
              method: 'PUT',
              body: {
                nome: this.newDependency.nome,
                versao: this.newDependency.versao,
                descricao: this.newDependency.descricao,
                tabela_origem: this.newDependency.tabela_origem,
              },
            },
          )
          this.showToast('Alteração atualizada com sucesso', 'success')
        } else {
          // Create new dependency
          const body = {
            tabela_origem: this.newDependency.tabela_origem,
            id_origem: this.newDependency.id_origem,
            nome: this.newDependency.nome,
            descricao: this.newDependency.descricao,
            versao: this.newDependency.versao,
            criador: this.newDependency.criador,
            dependencias: this.newDependency.dependencias,
          }

          console.log('Enviando dados para criação:', body)

          await this.useFetch('/api/v2/dependencias/itens', {
            method: 'POST',
            body,
          })
          this.showToast('Alteração criada com sucesso', 'success')
        }

        await this.loadDependencies()
        await this.loadStatistics()
        this.closeModal()
      } catch (error) {
        this.showToast('Erro ao salvar alteração', 'error')
        console.error('Save dependency error:', error)
      } finally {
        this.isSaving = false
      }
    },

    async openCreateModal() {
      this.showAddModal = true
      await this.loadTabelas()
      await this.loadOrigemItens()
      await this.ensureItens('AUD_FV')
      await this.ensureItens('AUD_SQLS')
      await this.ensureItens('AUD_REPORT')
    },

    async loadTabelas() {
      try {
        const tabs = await this.useFetch('/api/v2/dependencias/tabelas')
        if (Array.isArray(tabs) && tabs.length) this.tabelasDisponiveis = tabs
      } catch {}
    },

    async loadOrigemItens() {
      try {
        const t = this.newDependency.tabela_origem
        const itens = await this.useFetch(
          `/api/v2/dependencias/tabelas/${encodeURIComponent(t)}/itens`,
        )
        this.itensOrigem = itens
        if (!this.newDependency.id_origem && itens.length)
          this.newDependency.id_origem = itens[0].id
      } catch (e) {
        this.itensOrigem = []
      }
    },

    async ensureItens(tabela) {
      if (this.itensPorTabela[tabela] && this.itensPorTabela[tabela].length) return
      try {
        const itens = await this.useFetch(
          `/api/v2/dependencias/tabelas/${encodeURIComponent(tabela)}/itens`,
        )
        this.itensPorTabela[tabela] = itens
      } catch {}
    },

    adicionarSequencia() {
      this.newDependency.dependencias = []

      // Regra de negócio: não adiciona a tabela escolhida como origem
      if (this.depSelecionada.fv && this.newDependency.tabela_origem !== 'AUD_FV') {
        const itemFv = this.itensPorTabela.AUD_FV.find((fv) => fv.id == this.depSelecionada.fv)
        this.newDependency.dependencias.push({
          tabela_dependente: 'AUD_FV',
          id_dependente: this.depSelecionada.fv,
          nome_dependente: itemFv ? itemFv.nome : null,
          observacoes: this.observacoesDependencias,
        })
      }
      if (this.depSelecionada.sql && this.newDependency.tabela_origem !== 'AUD_SQLS') {
        const itemSql = this.itensPorTabela.AUD_SQLS.find((s) => s.id == this.depSelecionada.sql)
        this.newDependency.dependencias.push({
          tabela_dependente: 'AUD_SQLS',
          id_dependente: this.depSelecionada.sql,
          nome_dependente: itemSql ? itemSql.nome : null,
          observacoes: this.observacoesDependencias,
        })
      }
      if (this.depSelecionada.report && this.newDependency.tabela_origem !== 'AUD_REPORT') {
        const itemReport = this.itensPorTabela.AUD_REPORT.find(
          (r) => r.id == this.depSelecionada.report,
        )
        this.newDependency.dependencias.push({
          tabela_dependente: 'AUD_REPORT',
          id_dependente: this.depSelecionada.report,
          nome_dependente: itemReport ? itemReport.nome : null,
          observacoes: this.observacoesDependencias,
        })
      }

      // Limpa os campos após adicionar
      this.depSelecionada = { fv: null, sql: null, report: null }
      this.observacoesDependencias = ''
    },

    removerDependencia(index) {
      this.newDependency.dependencias.splice(index, 1)
    },

    async openDiagram(dep) {
      try {
        this.showDiagram = true
        this.mermaidDiagram = ''
        this.diagramData = dep

        // Busca JSON pronto no backend
        const model = await this.useFetch(`/api/v2/dependencias/itens/${dep.id}/json-model`)
        this.mermaidDiagram = toMermaidFlowchart(model)
      } catch (e) {
        this.showToast('Erro ao gerar diagrama', 'error')
        this.showDiagram = false
      }
    },

    downloadDiagram() {
      // Implementar download do diagrama como PNG
      this.showToast('Funcionalidade de download em desenvolvimento', 'info')
    },

    closeModal() {
      this.showAddModal = false
      this.editingDependency = null
      this.newDependency = {
        nome: '',
        versao: '',
        tabela_origem: 'AUD_FV',
        id_origem: null,
        criador: '',
        descricao: '',
        dependencias: [],
      }
      this.depSelecionada = { fv: null, sql: null, report: null }
      this.observacoesDependencias = ''
    },

    async viewHistory(dep) {
      try {
        const response = await this.useFetch(`/dependencias/alteracoes/${dep.id}/historico`)
        console.log('Histórico:', response.data)
        // Here you could open another modal or sidebar to show the history
        this.showToast(`Histórico carregado (${response.data.length} entradas)`, 'info')
      } catch (error) {
        this.showToast('Erro ao carregar histórico', 'error')
      }
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
        const category = this.dependencyTree.find((cat) => cat.name === dep.tabela_origem)
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

    updateFilterCounts() {
      // Count total
      this.filters[0].count = this.dependencies.length

      // Count by risk
      const riskCounts = {
        'Sem risco': 0,
        Baixo: 0,
        Médio: 0,
        Alto: 0,
      }

      this.dependencies.forEach((dep) => {
        if (riskCounts.hasOwnProperty(dep.risco)) {
          riskCounts[dep.risco]++
        }
      })

      // Update filter counts
      this.filters.forEach((filter) => {
        if (filter.id !== 'all' && riskCounts.hasOwnProperty(filter.id)) {
          filter.count = riskCounts[filter.id]
        }
      })
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

    formatDate(dateString) {
      if (!dateString) return 'N/A'

      try {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now - date)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return 'ontem'
        if (diffDays < 7) return `${diffDays} dias atrás`
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semanas atrás`
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} meses atrás`

        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
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

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.connection-status.connected {
  background: #dcfce7;
  color: #166534;
}

.connection-status.disconnected {
  background: #fee2e2;
  color: #991b1b;
}

.connection-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto 2rem;
  padding: 0 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
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
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
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

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.sem-risco {
  background: #0369a1;
}

.status-indicator.baixo {
  background: #10b981;
}

.status-indicator.medio {
  background: #f59e0b;
}

.status-indicator.alto {
  background: #ef4444;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s;
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

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: #1a202c;
}

.modal-close {
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

.modal-close:hover {
  background: #f1f5f9;
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
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

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .grid-view {
    grid-template-columns: 1fr;
  }

  .sidebar {
    width: 100%;
  }

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-chips {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-right {
    justify-content: space-between;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }

  .toast-container {
    left: 1rem;
    right: 1rem;
  }

  .toast {
    max-width: none;
  }
}

/* Estilos para o modal de diagrama */
.large-modal {
  max-width: 90vw;
  max-height: 90vh;
}

.diagram-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 1rem;
}

.loading-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
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

.diagram-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.diagram-details h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.diagram-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.diagram-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diagram-item:last-child {
  border-bottom: none;
}

.observacoes {
  font-style: italic;
  color: #666;
  font-size: 0.9rem;
}

/* Estilos para as sequências de dependências */
.sequencias-list {
  margin-top: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.sequencia-item {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.sequencia-item:last-child {
  border-bottom: none;
}

.sequencia-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.sequencia-tabela {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.sequencia-item {
  flex: 1;
  font-weight: 500;
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

.sequencia-observacoes {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dep-card {
    padding: 1rem;
  }

  .dep-card-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .dep-actions {
    justify-content: center;
  }
}
</style>
