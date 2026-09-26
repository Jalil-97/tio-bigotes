import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { labelEstado, siguienteEstado } from '../lib/estados'
import { labelTipoEntrega } from '../lib/tiposEntrega'
import { formatoPrecio, mensajeError } from '../lib/formato'
import './PedidosHoy.css'

const COLUMNAS = 'id, numero, cliente, tipo_entrega, estado, total, created_at'

// Inicio de hoy y de mañana en la hora local del dispositivo, en ISO (UTC).
function rangoHoy() {
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 1)
  return [inicio.toISOString(), fin.toISOString()]
}

// Pedidos creados hoy, del más nuevo al más viejo.
function consultarPedidosDeHoy() {
  const [desde, hasta] = rangoHoy()
  return supabase
    .from('pedidos')
    .select(COLUMNAS)
    .gte('created_at', desde)
    .lt('created_at', hasta)
    .order('created_at', { ascending: false })
}

function PedidosHoy() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const aplicarResultado = useCallback(({ data, error }) => {
    if (error) {
      setErrorCarga(mensajeError('cargar los pedidos', error))
    } else {
      setErrorCarga(null)
      setPedidos(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    let cancelado = false
    consultarPedidosDeHoy().then((resultado) => {
      if (!cancelado) aplicarResultado(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [aplicarResultado])

  function actualizar() {
    consultarPedidosDeHoy().then(aplicarResultado)
  }

  function reemplazar(pedido) {
    setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, ...pedido } : p)))
  }

  return (
    <div className="pantalla">
      <div className="encabezado">
        <h1>Pedidos de hoy</h1>
        <button type="button" onClick={actualizar}>
          Actualizar
        </button>
      </div>

      {cargando ? (
        <p>Cargando pedidos…</p>
      ) : errorCarga ? (
        <p className="error">{errorCarga}</p>
      ) : pedidos.length === 0 ? (
        <p className="vacio">Todavía no hay pedidos cargados hoy.</p>
      ) : (
        <table className="pedidos">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Estado</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <FilaPedido key={p.id} pedido={p} onActualizado={reemplazar} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function FilaPedido({ pedido, onActualizado }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const siguiente = siguienteEstado(pedido)

  async function avanzar() {
    setGuardando(true)
    setError(null)
    // Filtramos también por el estado actual: si el pedido ya cambió (otro
    // dispositivo, doble click), no lo avanzamos dos veces.
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: siguiente })
      .eq('id', pedido.id)
      .eq('estado', pedido.estado)
      .select(COLUMNAS)
      .single()
    setGuardando(false)
    if (error) {
      setError(
        error.code === 'PGRST116'
          ? 'No se pudo cambiar el estado: el pedido ya no está en ese estado o no hay permiso. Tocá "Actualizar".'
          : mensajeError('cambiar el estado', error),
      )
      return
    }
    onActualizado(data)
  }

  return (
    <>
      <tr>
        <td>{pedido.numero}</td>
        <td>{pedido.cliente}</td>
        <td>{labelTipoEntrega(pedido.tipo_entrega)}</td>
        <td>
          <span className={`badge estado-${pedido.estado}`}>{labelEstado(pedido.estado)}</span>
        </td>
        <td className="precio">{formatoPrecio.format(pedido.total)}</td>
        <td>
          {siguiente && (
            <button type="button" onClick={avanzar} disabled={guardando}>
              {guardando ? 'Guardando…' : `Pasar a: ${labelEstado(siguiente)}`}
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="error">
            {error}
          </td>
        </tr>
      )}
    </>
  )
}

export default PedidosHoy
