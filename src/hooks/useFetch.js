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

  const res = await fetch(`http://192.168.195.162:8000${endpoint}`, options)
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const message = data?.msg || `Erro ${res.status}: ${res.statusText}`
    throw new Error(message)
  }
  return data.data ?? data
}
