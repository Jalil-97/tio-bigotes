import { useEffect, useState } from 'react'
import { supabase, supabaseConfigError } from './lib/supabaseClient'

function App() {
  const [state, setState] = useState({
    loading: !supabaseConfigError,
    error: supabaseConfigError,
    row: null,
  })

  useEffect(() => {
    if (supabaseConfigError) return

    let cancelled = false

    async function checkConnection() {
      try {
        const { data, error } = await supabase
          .from('health_check')
          .select('*')
          .limit(1)

        if (cancelled) return
        if (error) {
          setState({ loading: false, error: error.message, row: null })
        } else if (!data || data.length === 0) {
          setState({
            loading: false,
            error: 'La conexión funcionó, pero la tabla health_check está vacía.',
            row: null,
          })
        } else {
          setState({ loading: false, error: null, row: data[0] })
        }
      } catch (err) {
        if (!cancelled) {
          setState({ loading: false, error: err?.message ?? String(err), row: null })
        }
      }
    }

    checkConnection()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.loading) return <p>Verificando conexión con Supabase…</p>

  if (state.error) {
    return (
      <div>
        <h1>Error de conexión</h1>
        <p>{state.error}</p>
      </div>
    )
  }

  const { row } = state
  const date = row.checked_at ?? row.created_at ?? row.updated_at ?? row.date

  return (
    <div>
      <h1>Conexión OK</h1>
      <p>Status: {String(row.status)}</p>
      <p>Fecha: {date ? String(date) : '(sin fecha)'}</p>
    </div>
  )
}

export default App
