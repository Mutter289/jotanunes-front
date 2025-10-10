export async function useFetch(
  endpoint,
  { method = 'GET', body = null, headers = {}, isFormData = false } = {},
) {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  console.log('Token encontrado:', token ? 'Sim' : 'Não')
  console.log('Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'Nenhum')

  const options = {
    method,
    headers: {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }

  if (body) {
    if (isFormData) {
      const formData = body instanceof FormData ? body : new FormData()
      if (!(body instanceof FormData)) {
        Object.entries(body).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item))
          } else {
            formData.append(key, value)
          }
        })
      }
      options.body = formData
    } else {
      options.headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
  }

  try {
    const baseUrl = (window.API_BASE_URL || '').startsWith('http')
      ? window.API_BASE_URL
      : `http://${window.API_BASE_URL || '192.168.195.162:8000'}`
    const res = await fetch(`http://192.168.195.162:8000${endpoint}`, options)

    let data
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (!res.ok) {
      // Criar objeto de erro com informações detalhadas
      const error = new Error(`Erro HTTP: ${res.status}`)
      error.status = res.status
      error.statusText = res.statusText
      error.data = data

      // Mensagens personalizadas por código de status
      switch (res.status) {
        case 400:
          error.message = data?.msg || data?.detail || 'Requisição inválida'
          break
        case 401:
          error.message = 'Não autorizado. Faça login novamente.'
          break
        case 403:
          error.message = 'Acesso negado'
          break
        case 404:
          error.message = 'Recurso não encontrado'
          break
        case 422:
          // Tratar erros de validação do FastAPI/Pydantic
          if (data?.detail && Array.isArray(data.detail)) {
            const validationErrors = data.detail
              .map((err) => {
                const field = err.loc?.slice(1).join('.') || 'campo desconhecido'
                return `${field}: ${err.msg}`
              })
              .join('; ')
            error.message = `Erro de validação: ${validationErrors}`
          } else {
            error.message = data?.msg || data?.detail || 'Erro de validação dos dados'
          }
          break
        case 500:
          error.message = 'Erro interno do servidor'
          break
        default:
          error.message = data?.msg || data?.detail || `Erro ${res.status}: ${res.statusText}`
      }

      // Log detalhado do erro
      console.error(`Erro HTTP ${res.status}:`, JSON.stringify(data, null, 2))

      throw error
    }

    return data.data ?? data
  } catch (error) {
    // Se for um erro de rede ou outro erro não relacionado ao HTTP
    if (!error.status) {
      console.error('Erro de rede ou conexão:', error)
      throw new Error('Erro de conexão com o servidor. Verifique sua internet.')
    }

    // Re-lançar erros HTTP já tratados
    throw error
  }
}

function mockResponse(endpoint) {
  try {
    if (
      endpoint &&
      endpoint.startsWith('/api/v2/dependencias/itens/') &&
      endpoint.endsWith('/json-model')
    ) {
      return {
        titulo_dependencia: 'Titulo',
        versao: 'v1.0.0',
        criado: 'Gustavo Trindade',
        origem: {
          tabela: 'AUD_SQLS',
          item: 'SELECT * FROM AUD_SQLS',
          id: 'COD2201.0001',
        },
        descricao: 'aqui vai ter uma descrição',
        dependencias: [
          { tabela: 'AUD_FVS', item: 'alguma coisa vaivim aqui', id: 1 },
          { tabela: 'AUD_REPORTS', item: 'alguma coisa vaivim aqui', id: 1 },
        ],
      }
    }
  } catch {}
}
