import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIAS } from '../lib/categorias'
import { MEDIOS_PAGO } from '../lib/mediosPago'
import { formatoPrecio, mensajeError, porNombre } from '../lib/formato'
import './NuevoPedido.css'

// Cantidad válida: entero mayor a cero.
function parseCantidad(texto) {
  const n = Number(texto)
  return Number.isInteger(n) && n > 0 ? n : null
}

function redondear(n) {
  return Math.round(n * 100) / 100
}

function NuevoPedido() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const [cliente, setCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [medioPago, setMedioPago] = useState(MEDIOS_PAGO[0].valor)
  // Cada ítem es una copia del producto al momento de agregarlo:
  // { productoId, nombre, precio, cantidad } (cantidad como texto del input).
  const [items, setItems] = useState([])

  const [productoSel, setProductoSel] = useState('')
  const [cantidadSel, setCantidadSel] = useState('1')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [numeroGuardado, setNumeroGuardado] = useState(null)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErrorCarga(mensajeError('cargar el catálogo', error))
        else setProductos(data)
        setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  function agregarItem() {
    const producto = productos.find((p) => p.id === productoSel)
    if (!producto) {
      setError('Elegí un producto para agregar.')
      return
    }
    const cantidad = parseCantidad(cantidadSel)
    if (!cantidad) {
      setError('La cantidad tiene que ser un número entero mayor a cero.')
      return
    }
    setError(null)
    setItems((prev) => {
      const existente = prev.find((it) => it.productoId === producto.id)
      if (existente) {
        // Si ya estaba, sumamos la cantidad en la misma fila.
        const actual = parseCantidad(existente.cantidad) ?? 0
        return prev.map((it) =>
          it === existente ? { ...it, cantidad: String(actual + cantidad) } : it,
        )
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          cantidad: String(cantidad),
        },
      ]
    })
    setProductoSel('')
    setCantidadSel('1')
  }

  function cambiarCantidad(productoId, texto) {
    setItems((prev) =>
      prev.map((it) => (it.productoId === productoId ? { ...it, cantidad: texto } : it)),
    )
  }

  function sacarItem(productoId) {
    setItems((prev) => prev.filter((it) => it.productoId !== productoId))
  }

  const total = redondear(
    items.reduce((suma, it) => suma + it.precio * (parseCantidad(it.cantidad) ?? 0), 0),
  )

  async function enviar(e) {
    e.preventDefault()
    setNumeroGuardado(null)

    if (!cliente.trim()) {
      setError('Falta el nombre del cliente.')
      return
    }
    if (items.length === 0) {
      setError('El pedido tiene que tener al menos un ítem.')
      return
    }
    if (items.some((it) => !parseCantidad(it.cantidad))) {
      setError('Todas las cantidades tienen que ser números enteros mayores a cero.')
      return
    }

    setGuardando(true)
    setError(null)
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        cliente: cliente.trim(),
        direccion: direccion.trim() || null,
        medio_pago: medioPago,
        items: items.map((it) => ({
          nombre: it.nombre,
          precio_unitario: it.precio,
          cantidad: parseCantidad(it.cantidad),
        })),
        total,
      })
      .select('numero')
      .single()
    setGuardando(false)

    if (error) {
      // No limpiamos nada: lo cargado queda para reintentar.
      setError(mensajeError('guardar el pedido', error))
      return
    }

    setNumeroGuardado(data.numero)
    setCliente('')
    setDireccion('')
    setMedioPago(MEDIOS_PAGO[0].valor)
    setItems([])
    setProductoSel('')
    setCantidadSel('1')
  }

  return (
    <div className="pantalla">
      <h1>Nuevo pedido</h1>

      {numeroGuardado !== null && (
        <p className="exito">Pedido #{numeroGuardado} guardado.</p>
      )}

      <form className="nuevo" onSubmit={enviar} noValidate>
        <div className="campos">
          <label>
            Cliente
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </label>
          <label>
            Dirección (opcional)
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </label>
          <label>
            Medio de pago
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              {MEDIOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h2>Ítems</h2>

        {cargando ? (
          <p>Cargando catálogo…</p>
        ) : errorCarga ? (
          <p className="error">{errorCarga}</p>
        ) : productos.length === 0 ? (
          <p className="vacio">No hay productos activos en el catálogo.</p>
        ) : (
          <div className="campos">
            <label>
              Producto
              <select value={productoSel} onChange={(e) => setProductoSel(e.target.value)}>
                <option value="">Elegí un producto…</option>
                {CATEGORIAS.map(({ valor, label }) => {
                  const delGrupo = productos
                    .filter((p) => p.categoria === valor)
                    .sort(porNombre)
                  if (delGrupo.length === 0) return null
                  return (
                    <optgroup key={valor} label={label}>
                      {delGrupo.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} — {formatoPrecio.format(p.precio)}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            </label>
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                className="cantidad-input"
                value={cantidadSel}
                onChange={(e) => setCantidadSel(e.target.value)}
                onKeyDown={(e) => {
                  // Enter agrega el ítem en vez de enviar el pedido.
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    agregarItem()
                  }
                }}
              />
            </label>
            <button type="button" onClick={agregarItem}>
              Agregar ítem
            </button>
          </div>
        )}

        {items.length > 0 && (
          <table className="items">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const cantidad = parseCantidad(it.cantidad)
                return (
                  <tr key={it.productoId}>
                    <td>{it.nombre}</td>
                    <td className="precio">{formatoPrecio.format(it.precio)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="cantidad-input"
                        value={it.cantidad}
                        onChange={(e) => cambiarCantidad(it.productoId, e.target.value)}
                        aria-label={`Cantidad de ${it.nombre}`}
                      />
                    </td>
                    <td className="precio">
                      {cantidad ? formatoPrecio.format(redondear(it.precio * cantidad)) : '—'}
                    </td>
                    <td>
                      <button type="button" onClick={() => sacarItem(it.productoId)}>
                        Sacar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <p className="total">
          Total: <span className="precio">{formatoPrecio.format(total)}</span>
        </p>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar pedido'}
        </button>
      </form>
    </div>
  )
}

export default NuevoPedido
