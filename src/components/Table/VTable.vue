<template>
  <div class="v-table-container">
    <!-- Search Bar -->
    <div v-if="searchable" class="v-table-search">
      <div class="search-header">
        <h3 class="search-title">Filtros de Pesquisa</h3>
        <button v-if="hasActiveFilters" class="clear-filters-btn" @click="clearAllFilters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Limpar Filtros
        </button>
      </div>

      <div class="filters-row">
        <div class="search-input-wrapper">
          <svg
            class="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div v-if="filterableColumns.length > 0" class="filter-group">
          <label class="filter-label">Coluna:</label>
          <select v-model="selectedColumn" class="filter-select">
            <option value="">Todas</option>
            <option v-for="col in filterableColumns" :key="col.key" :value="col.key">
              {{ col.label }}
            </option>
          </select>
        </div>

        <div v-if="statusOptions.length > 0" class="filter-group">
          <label class="filter-label">Status:</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="">Todos</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <button class="icon-btn refresh-btn" @click="handleRefresh" title="Atualizar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
        </button>
      </div>

      <div class="search-footer">
        <span class="results-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          {{ filteredData.length }} de {{ data.length }} registros
        </span>
        <div class="nav-controls">
          <button class="icon-btn nav-btn" @click="navigatePrev" :disabled="!canNavigatePrev" title="Anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button class="icon-btn nav-btn" @click="navigateNext" :disabled="!canNavigateNext" title="Próximo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="v-table-wrapper">
      <table class="v-table">
        <thead>
          <tr>
            <th v-if="selectable" class="checkbox-column">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="checkbox"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'table-header',
                column.sortable && 'sortable',
                column.align && `text-${column.align}`,
                column.className,
              ]"
              :style="column.width ? { width: column.width, minWidth: column.width } : {}"
              @click="column.sortable && handleSort(column.key)"
            >
              <div class="header-content">
                <span class="header-text">{{ column.label }}</span>
                <span v-if="column.sortable && sortKey === column.key" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
            <th v-if="hasActions" class="actions-column">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            :class="['table-row', rowClass(row)]"
            @click="handleRowClick(row)"
          >
            <td v-if="selectable" class="checkbox-column">
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                @change="toggleRowSelection(row)"
                @click.stop
                class="checkbox"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'table-cell',
                column.align && `text-${column.align}`,
                column.cellClassName,
                column.wrap === false && 'no-wrap',
                (column.truncate || shouldTruncate(getNestedValue(row, column.key), column)) &&
                  'truncate',
              ]"
              :style="column.maxWidth ? { maxWidth: column.maxWidth } : {}"
              :title="
                shouldShowTooltip(getNestedValue(row, column.key), column)
                  ? getNestedValue(row, column.key)
                  : ''
              "
            >
              <div class="cell-content">
                <!-- Custom slot for cell content -->
                <slot
                  :name="`cell-${column.key}`"
                  :value="getNestedValue(row, column.key)"
                  :row="row"
                  :column="column"
                >
                  <!-- Default cell content -->
                  <component
                    v-if="column.component"
                    :is="column.component"
                    :value="getNestedValue(row, column.key)"
                    :row="row"
                    :column="column"
                  />
                  <span v-else-if="column.formatter" class="cell-text">
                    {{
                      formatCellValue(
                        column.formatter(getNestedValue(row, column.key), row),
                        column,
                      )
                    }}
                  </span>
                  <span v-else class="cell-text">
                    {{ formatCellValue(getNestedValue(row, column.key), column) }}
                  </span>
                </slot>
              </div>
            </td>
            <td v-if="hasActions" class="actions-column">
              <div class="actions-wrapper">
                <slot name="actions" :row="row">
                  <button
                    v-for="action in actions"
                    :key="action.key"
                    @click.stop="handleAction(action, row)"
                    :class="[
                      'action-btn',
                      action.className,
                      action.variant && `action-btn-${action.variant}`,
                    ]"
                    :disabled="action.disabled && action.disabled(row)"
                    :title="action.tooltip"
                  >
                    <!-- Built-in icons -->
                    <svg
                      v-if="action.icon === 'lock'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'unlock'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 019.9-1"></path>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'link'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'trash'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                      ></path>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'edit'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'view'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg
                      v-else-if="action.icon === 'download'"
                      class="action-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <!-- Custom component icon -->
                    <component
                      v-else-if="action.icon && typeof action.icon !== 'string'"
                      :is="action.icon"
                      class="action-icon"
                    />
                    <span v-if="action.label">{{ action.label }}</span>
                  </button>
                </slot>
                <button
                  v-if="showMoreActions"
                  class="action-btn more-btn"
                  @click.stop="toggleMoreMenu(row)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="totalColumns" class="empty-state">
              <slot name="empty">
                <div class="empty-content">
                  <p>{{ emptyText }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="paginate && filteredData.length > 0" class="v-table-pagination">
      <div class="pagination-info">
        Mostrando {{ paginationStart }} de {{ paginationEnd }} páginas
      </div>
      <div class="pagination-controls">
        <button class="pagination-btn" @click="currentPage = 1" :disabled="currentPage === 1">
          Primeiro
        </button>
        <button class="pagination-btn" @click="currentPage--" :disabled="currentPage === 1">
          Voltar
        </button>
        <span class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="currentPage = page"
            :class="['page-btn', { active: currentPage === page }]"
          >
            {{ page }}
          </button>
        </span>
        <button
          class="pagination-btn"
          @click="currentPage++"
          :disabled="currentPage === totalPages"
        >
          Próximo
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      required: true,
      default: () => [],
    },
    columns: {
      type: Array,
      required: true,
      default: () => [],
      // Enhanced column structure:
      // {
      //   key: 'name',
      //   label: 'Name',
      //   sortable: true,
      //   width: '200px',
      //   minWidth: '150px',
      //   maxWidth: '300px',
      //   align: 'left' | 'center' | 'right',
      //   formatter: (value, row) => value,
      //   component: VueComponent,
      //   className: 'custom-class',
      //   cellClassName: 'cell-class',
      //   truncate: true/false,    // Manual override (opcional)
      //   wrap: false,              // Prevent text wrapping
      //   showTooltip: true/false,  // Manual override (opcional)
      //   autoTruncate: true        // Enable auto-truncate for texts > 150 chars (default: true)
      // }
    },

    // Features
    searchable: {
      type: Boolean,
      default: true,
    },
    searchPlaceholder: {
      type: String,
      default: 'Search by name, email or more',
    },
    searchKeys: {
      type: Array,
      default: () => [],
    },
    selectable: {
      type: Boolean,
      default: true,
    },
    paginate: {
      type: Boolean,
      default: true,
    },
    pageSize: {
      type: Number,
      default: 10,
    },

    // Actions
    actions: {
      type: Array,
      default: () => [],
    },
    showMoreActions: {
      type: Boolean,
      default: true,
    },

    // Customization
    rowKey: {
      type: [String, Function],
      default: 'id',
    },
    rowClass: {
      type: Function,
      default: () => '',
    },
    emptyText: {
      type: String,
      default: 'No data available',
    },

    // Filter options
    statusOptions: {
      type: Array,
      default: () => [],
    },

    // Events handlers
    onRowClick: {
      type: Function,
      default: null,
    },
    onSelectionChange: {
      type: Function,
      default: null,
    },
    onRefresh: {
      type: Function,
      default: null,
    },
  },

  data() {
    return {
      searchQuery: '',
      selectedRows: [],
      sortKey: null,
      sortOrder: 'asc',
      currentPage: 1,
      moreMenuRow: null,
      selectedColumn: '',
      selectedStatus: '',
    }
  },

  computed: {
    hasActions() {
      return this.actions.length > 0 || this.$slots.actions
    },

    totalColumns() {
      let count = this.columns.length
      if (this.selectable) count++
      if (this.hasActions) count++
      return count
    },

    filterableColumns() {
      return this.columns.filter((col) => col.filterable !== false)
    },

    hasActiveFilters() {
      return this.searchQuery || this.selectedColumn || this.selectedStatus
    },

    filteredData() {
      let result = [...this.data]

      // Column filter
      if (this.selectedColumn) {
        result = result.filter((row) => {
          const value = this.getNestedValue(row, this.selectedColumn)
          return value !== null && value !== undefined && value !== ''
        })
      }

      // Status filter
      if (this.selectedStatus) {
        result = result.filter((row) => {
          const statusValue = this.getNestedValue(row, 'status') || this.getNestedValue(row, 'estado')
          return statusValue && statusValue.toString() === this.selectedStatus
        })
      }

      // Search
      if (this.searchQuery && this.searchable) {
        const query = this.searchQuery.toLowerCase()
        const searchKeys =
          this.searchKeys.length > 0 ? this.searchKeys : this.columns.map((col) => col.key)

        result = result.filter((row) => {
          return searchKeys.some((key) => {
            const value = this.getNestedValue(row, key)
            return value && value.toString().toLowerCase().includes(query)
          })
        })
      }

      // Sort
      if (this.sortKey) {
        result.sort((a, b) => {
          const aVal = this.getNestedValue(a, this.sortKey)
          const bVal = this.getNestedValue(b, this.sortKey)

          if (aVal === bVal) return 0

          const comparison = aVal > bVal ? 1 : -1
          return this.sortOrder === 'asc' ? comparison : -comparison
        })
      }

      return result
    },

    paginatedData() {
      if (!this.paginate) return this.filteredData

      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData.slice(start, end)
    },

    totalPages() {
      return Math.ceil(this.filteredData.length / this.pageSize)
    },

    visiblePages() {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
      let end = Math.min(this.totalPages, start + maxVisible - 1)

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      return pages
    },

    paginationStart() {
      return (this.currentPage - 1) * this.pageSize + 1
    },

    paginationEnd() {
      return Math.min(this.currentPage * this.pageSize, this.filteredData.length)
    },

    isAllSelected() {
      return (
        this.paginatedData.length > 0 && this.paginatedData.every((row) => this.isRowSelected(row))
      )
    },

    isIndeterminate() {
      const selected = this.paginatedData.filter((row) => this.isRowSelected(row))
      return selected.length > 0 && selected.length < this.paginatedData.length
    },

    canNavigatePrev() {
      return this.currentPage > 1
    },

    canNavigateNext() {
      return this.currentPage < this.totalPages
    },
  },

  methods: {
    getNestedValue(obj, path) {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    },

    getRowKey(row, index) {
      if (typeof this.rowKey === 'function') {
        return this.rowKey(row, index)
      }
      return row[this.rowKey] || index
    },

    // Método para verificar se deve truncar o texto
    shouldTruncate(value, column) {
      // Se já foi definido manualmente, respeita
      if (column.truncate !== undefined) {
        return column.truncate
      }

      // Auto-truncate para textos maiores que 150 caracteres
      if (value && typeof value === 'string') {
        return value.length > 150
      }

      return false
    },

    // Método para verificar se deve mostrar tooltip
    shouldShowTooltip(value, column) {
      // Se foi definido manualmente, respeita
      if (column.showTooltip !== undefined) {
        return column.showTooltip
      }

      // Auto-tooltip para textos truncados
      return this.shouldTruncate(value, column)
    },

    // Método para formatar o valor da célula
    formatCellValue(value, column) {
      if (!value) return value

      // Se não deve truncar, retorna o valor original
      if (!this.shouldTruncate(value, column)) {
        return value
      }

      // Para textos muito longos, corta manualmente se não for CSS truncate
      if (typeof value === 'string' && value.length > 150 && !column.truncate) {
        return value.substring(0, 147) + '...'
      }

      return value
    },

    handleSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'asc'
      }
    },

    handleRowClick(row) {
      if (this.onRowClick) {
        this.onRowClick(row)
      }
      this.$emit('row-click', row)
    },

    handleAction(action, row) {
      if (action.handler) {
        action.handler(row)
      }
      this.$emit('action', { action, row })
    },

    handleRefresh() {
      if (this.onRefresh) {
        this.onRefresh()
      }
      this.$emit('refresh')
    },

    clearAllFilters() {
      this.searchQuery = ''
      this.selectedColumn = ''
      this.selectedStatus = ''
      this.currentPage = 1
    },

    isRowSelected(row) {
      const key = this.getRowKey(row)
      return this.selectedRows.some((selected) => this.getRowKey(selected) === key)
    },

    toggleRowSelection(row) {
      const key = this.getRowKey(row)
      const index = this.selectedRows.findIndex((selected) => this.getRowKey(selected) === key)

      if (index > -1) {
        this.selectedRows.splice(index, 1)
      } else {
        this.selectedRows.push(row)
      }

      this.emitSelectionChange()
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.paginatedData.forEach((row) => {
          const index = this.selectedRows.findIndex(
            (selected) => this.getRowKey(selected) === this.getRowKey(row),
          )
          if (index > -1) {
            this.selectedRows.splice(index, 1)
          }
        })
      } else {
        this.paginatedData.forEach((row) => {
          if (!this.isRowSelected(row)) {
            this.selectedRows.push(row)
          }
        })
      }

      this.emitSelectionChange()
    },

    emitSelectionChange() {
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedRows)
      }
      this.$emit('selection-change', this.selectedRows)
    },

    toggleMoreMenu(row) {
      this.moreMenuRow = this.moreMenuRow === row ? null : row
      this.$emit('more-menu', row)
    },

    navigatePrev() {
      if (this.canNavigatePrev) {
        this.currentPage--
      }
    },

    navigateNext() {
      if (this.canNavigateNext) {
        this.currentPage++
      }
    },

    // Public methods
    clearSelection() {
      this.selectedRows = []
      this.emitSelectionChange()
    },

    selectAll() {
      this.selectedRows = [...this.filteredData]
      this.emitSelectionChange()
    },

    getSelectedRows() {
      return this.selectedRows
    },

    resetFilters() {
      this.searchQuery = ''
      this.sortKey = null
      this.sortOrder = 'asc'
      this.currentPage = 1
    },
  },

  watch: {
    searchQuery() {
      this.currentPage = 1
    },

    pageSize() {
      this.currentPage = 1
    },

    data: {
      handler() {
        // Reset to first page when data changes
        if (this.currentPage > this.totalPages) {
          this.currentPage = 1
        }
      },
      deep: true,
    },
  },
}
</script>

<style scoped>
/* Root variables for consistency */
:root {
  --table-border-radius: 8px;
  --cell-padding-y: 12px;
  --cell-padding-x: 16px;
  --header-bg: linear-gradient(to bottom, var(--white-color), rgba(240, 240, 240, 0.3));
  --row-hover-bg: linear-gradient(to right, transparent, var(--theme-color-hover), transparent);
}

.v-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Search Section */
.v-table-search {
  background: linear-gradient(135deg, #bc1f1b 0%, #8b1714 100%);
  border-radius: 16px 16px 0 0;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--white-color);
  letter-spacing: 0.3px;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: var(--white-color);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-filters-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--grey-dark);
  pointer-events: none;
  transition: color 0.3s;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 42px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.95);
  color: var(--secundary-color);
}

.search-input:focus {
  border-color: var(--white-color);
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: var(--grey-dark);
  font-weight: 400;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--grey-dark);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-search-btn:hover {
  background: var(--theme-color-hover);
  color: var(--theme-color);
  transform: translateY(-50%) scale(1.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.filter-group:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--white-color);
  white-space: nowrap;
  margin: 0;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--secundary-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.filter-select:hover {
  background: white;
  border-color: white;
}

.filter-select:focus {
  outline: none;
  border-color: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.icon-btn {
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white-color);
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.search-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.results-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--white-color);
  white-space: nowrap;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Table Wrapper */
.v-table-wrapper {
  overflow-x: auto;
  background: white;
  position: relative;
  min-height: 500px;
}

.v-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed; /* Important for controlling column widths */
}

/* Table Header */
.v-table thead {
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  border-bottom: 3px solid var(--theme-color);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-header {
  padding: var(--cell-padding-y) var(--cell-padding-x);
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: var(--secundary-color);
  white-space: nowrap;
  user-select: none;
  position: relative;
  border-right: 1px solid rgba(221, 221, 221, 0.3);
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-header:last-child {
  border-right: none;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-header.sortable {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-header.sortable:hover {
  background: linear-gradient(135deg, var(--theme-color-hover), rgba(188, 31, 27, 0.15));
  color: var(--theme-color);
  transform: translateY(-2px);
}

.sort-indicator {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--theme-color);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Table Rows */
.table-row {
  border-bottom: 1px solid rgba(221, 221, 221, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  position: relative;
}

.table-row:hover {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, var(--theme-color-hover) 50%, rgba(255, 255, 255, 0) 100%);
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(188, 31, 27, 0.1);
  z-index: 1;
}

.table-row:nth-child(even) {
  background: rgba(240, 240, 240, 0.3);
}

.table-row:nth-child(even):hover {
  background: linear-gradient(90deg, rgba(240, 240, 240, 0.3) 0%, var(--theme-color-hover) 50%, rgba(240, 240, 240, 0.3) 100%);
}

/* Table Cells - Enhanced */
.table-cell {
  padding: 0;
  font-size: 14px;
  color: var(--secundary-color);
  border-right: 1px solid rgba(221, 221, 221, 0.1);
  position: relative;
  overflow: hidden; /* Prevent content overflow */
  vertical-align: middle;
}

.table-cell:last-child {
  border-right: none;
}

/* Cell Content Wrapper */
.cell-content {
  padding: var(--cell-padding-y) var(--cell-padding-x);
  min-height: 48px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

/* Cell Text Handling */
.cell-text {
  display: block;
  width: 100%;
  word-break: break-word; /* Break long words */
  overflow-wrap: break-word; /* Alternative for better support */
  hyphens: auto; /* Add hyphens when breaking words */
  line-height: 1.5;
}

/* Truncate Option */
.table-cell.truncate .cell-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* No Wrap Option */
.table-cell.no-wrap .cell-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Checkbox Column */
.checkbox-column {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid rgba(221, 221, 221, 0.1);
}

.checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--theme-color);
}

/* Actions Column */
.actions-column {
  width: auto;
  min-width: 120px;
  padding: 8px 12px;
  text-align: right;
  position: sticky;
  right: 0;
  background: inherit;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.05);
}

.actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
}

/* Action Buttons */
.action-btn {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--grey-dark);
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--theme-color-hover);
  border-color: var(--theme-color);
  transform: scale(1.05);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-primary {
  color: var(--theme-color);
}

.action-btn-primary:hover:not(:disabled) {
  background: var(--theme-color);
  color: white;
}

.action-btn-success {
  color: #10b981;
}

.action-btn-success:hover:not(:disabled) {
  background: #10b981;
  color: white;
}

.action-btn-warning {
  color: #f59e0b;
}

.action-btn-warning:hover:not(:disabled) {
  background: #f59e0b;
  color: white;
}

.action-btn-danger {
  color: var(--theme-color);
}

.action-btn-danger:hover:not(:disabled) {
  background: var(--badge-gradient);
  color: white;
  border-color: transparent;
}

.action-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.more-btn {
  padding: 4px;
}

.more-btn:hover {
  background: var(--theme-color-hover);
  border-radius: 50%;
}

/* Empty State */
.empty-state {
  padding: 200px 16px;
  text-align: center;
  color: var(--grey-dark);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), var(--theme-color-hover), rgba(255, 255, 255, 0.5));
  height: 100%;
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--theme-color-hover), transparent);
  opacity: 0.3;
  border-radius: 50%;
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
}

.empty-content p {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--secundary-color);
  position: relative;
  z-index: 1;
}

/* Pagination */
.v-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 3px solid var(--theme-color);
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.pagination-info {
  font-size: 14px;
  color: var(--secundary-color);
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn,
.page-btn {
  padding: 8px 14px;
  border: 2px solid var(--grey-color);
  background: white;
  font-size: 13px;
  color: var(--secundary-color);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  font-weight: 600;
}

.pagination-btn:hover:not(:disabled),
.page-btn:hover:not(.active) {
  background: var(--theme-color-hover);
  border-color: var(--theme-color);
  color: var(--theme-color);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 12px rgba(188, 31, 27, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--grey-color);
  border-color: var(--grey-color);
}

.page-btn.active {
  background: var(--badge-gradient);
  color: white;
  border-color: var(--theme-color);
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(188, 31, 27, 0.4);
  transform: translateY(-2px);
}

.page-btn.active:hover {
  transform: translateY(-3px) scale(1.05);
}

.page-numbers {
  display: flex;
  gap: 6px;
  margin: 0 8px;
}

/* Text Alignment */
.text-left {
  text-align: left;
}

.text-left .cell-content {
  justify-content: flex-start;
}

.text-center {
  text-align: center;
}

.text-center .cell-content {
  justify-content: center;
}

.text-right {
  text-align: right;
}

.text-right .cell-content {
  justify-content: flex-end;
}

/* Custom Scrollbar */
.v-table-wrapper::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.v-table-wrapper::-webkit-scrollbar-track {
  background: var(--grey-color);
  border-radius: 4px;
}

.v-table-wrapper::-webkit-scrollbar-thumb {
  background: var(--theme-color);
  border-radius: 4px;
  transition: all 0.2s;
}

.v-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--secundary-color);
}

/* Loading State */
.v-table-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-row {
  animation: fadeIn 0.3s ease-out;
}

/* Focus States */
.action-btn:focus,
.pagination-btn:focus,
.page-btn:focus,
.icon-btn:focus {
  outline: 2px solid var(--theme-color);
  outline-offset: 2px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .v-table {
    table-layout: auto;
  }

  .table-cell {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .v-table-search {
    flex-direction: column;
    gap: 12px;
  }

  .search-input-wrapper {
    max-width: 100%;
  }

  .v-table-pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .table-row:hover {
    transform: none;
    background: rgba(0, 0, 0, 0.02);
  }

  /* Mobile-specific cell handling */
  .table-cell {
    font-size: 13px;
    min-width: 100px;
  }

  .cell-content {
    padding: 10px 12px;
    min-height: 40px;
  }

  /* Force text wrapping on mobile */
  .cell-text {
    font-size: 12px;
    line-height: 1.4;
  }

  /* Reduce action button size on mobile */
  .action-btn {
    padding: 4px 8px;
    font-size: 12px;
  }

  .action-icon {
    width: 14px;
    height: 14px;
  }
}

/* Special handling for long content */
.v-table-wrapper.has-scroll {
  position: relative;
}

.v-table-wrapper.has-scroll::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 30px;
  background: linear-gradient(to left, rgba(255, 255, 255, 1), transparent);
  pointer-events: none;
  z-index: 1;
}

/* Tooltip for truncated content */
.table-cell[title] {
  cursor: help;
}

.table-cell[title]:hover .cell-text {
  position: relative;
}

.table-cell[title]:hover .cell-text::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  font-size: 12px;
  white-space: normal;
  max-width: 300px;
  border-radius: 4px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Print styles */
@media print {
  .v-table-search,
  .v-table-pagination,
  .actions-column,
  .checkbox-column {
    display: none !important;
  }

  .v-table-wrapper {
    overflow: visible;
  }

  .table-cell {
    border: 1px solid #ddd;
    padding: 8px !important;
  }

  .table-row {
    page-break-inside: avoid;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .table-header,
  .table-cell {
    border: 1px solid currentColor;
  }

  .table-row:hover {
    outline: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
