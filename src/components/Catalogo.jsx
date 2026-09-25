import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIAS } from '../lib/categorias'
import './Catalogo.css'

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function porNombre(a, b) {
  return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
}

// Convierte errores de Supabase / red en un mensaje entendible.
function mensajeError(accion, error) {
  if (error?.code === 'PGRST116') {
    return `No se pudo ${accion}: el producto no existe o no hay permiso para modificarlo.`
  }
  if (error?.message?.includes('Failed to fetch')) {
    return `No se pudo ${accion}: no hay conexión con el servidor. Revisá internet y probá de nuevo.`
  }
  return `No se pudo ${accion}: ${error?.message ?? 'error desconocido'}.`
}

// Valida nombre y precio tipeados. Devuelve { error } o { nombre, precio }.
function validar(nombre, precioTexto) {
  const nombreLimpio = nombre.trim()
  if (!nombreLimpio) return { error: 'El nombre no puede estar vacío.' }
  const precio = Number(String(precioTexto).replace(',', '.'))
  if (String(precioTexto).trim() === '' || !Number.isFinite(precio) || precio < 0) {
    return { error: 'El precio tiene que ser un número mayor o igual a 0.' }
  }
  return { nombre: nombreLimpio, precio }
}

function Catalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [verDesactivados, setVerDesactivados] = useState(false)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('productos')
      .select('*')
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

  function agregar(producto) {
    setProductos((prev) => [...prev, producto])
  }

  function reemplazar(producto) {
    setProductos((prev) => prev.map((p) => (p.id === producto.id ? producto : p)))
  }

  if (cargando) return <p>Cargando catálogo…</p>
  if (errorCarga) return <p className="error">{errorCarga}</p>

  const activos = productos.filter((p) => p.activo)
  const desactivados = productos.filter((p) => !p.activo).sort(porNombre)
  // Por si hubiera en la base algún producto con una categoría fuera de las 6.
  const sinCategoria = activos.filter((p) => !CATEGORIAS.includes(p.categoria))

  return (
    <div className="catalogo">
      <h1>Catálogo</h1>

      <FormNuevoProducto onCreado={agregar} />

      {CATEGORIAS.map((categoria) => {
        const items = activos.filter((p) => p.categoria === categoria).sort(porNombre)
        return (
          <section key={categoria}>
            <h2>{categoria}</h2>
            {items.length === 0 ? (
              <p className="vacio">Sin productos.</p>
            ) : (
              <ul>
                {items.map((p) => (
                  <FilaProducto key={p.id} producto={p} onActualizado={reemplazar} />
                ))}
              </ul>
            )}
          </section>
        )
      })}

      {sinCategoria.length > 0 && (
        <section>
          <h2>Otras</h2>
          <ul>
            {sinCategoria.sort(porNombre).map((p) => (
              <FilaProducto key={p.id} producto={p} onActualizado={reemplazar} />
            ))}
          </ul>
        </section>
      )}

      <div className="desactivados">
        <button
          type="button"
          className="link"
          onClick={() => setVerDesactivados((v) => !v)}
        >
          {verDesactivados ? 'Ocultar desactivados' : `Ver desactivados (${desactivados.length})`}
        </button>

        {verDesactivados &&
          (desactivados.length === 0 ? (
            <p className="vacio">No hay productos desactivados.</p>
          ) : (
            <ul>
              {desactivados.map((p) => (
                <FilaDesactivado key={p.id} producto={p} onActualizado={reemplazar} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}

function FormNuevoProducto({ onCreado }) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [precio, setPrecio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    const valido = validar(nombre, precio)
    if (valido.error) {
      setError(valido.error)
      return
    }

    setGuardando(true)
    setError(null)
    const { data, error } = await supabase
      .from('productos')
      .insert({ nombre: valido.nombre, categoria, precio: valido.precio, activo: true })
      .select()
      .single()
    setGuardando(false)

    if (error) {
      // No limpiamos el formulario: lo tipeado queda para reintentar.
      setError(mensajeError('guardar el producto', error))
      return
    }
    onCreado(data)
    // Mantenemos la categoría elegida para cargar varios seguidos.
    setNombre('')
    setPrecio('')
  }

  return (
    <form className="nuevo" onSubmit={guardar}>
      <h2>Agregar producto</h2>
      <div className="campos">
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label>
          Categoría
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Precio
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </label>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  )
}

function FilaProducto({ producto, onActualizado }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function empezarEdicion() {
    setNombre(producto.nombre)
    setPrecio(String(producto.precio))
    setError(null)
    setEditando(true)
  }

  function cancelar() {
    setEditando(false)
    setError(null)
  }

  async function actualizar(cambios, accion) {
    setGuardando(true)
    setError(null)
    const { data, error } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', producto.id)
      .select()
      .single()
    setGuardando(false)
    if (error) {
      setError(mensajeError(accion, error))
      return false
    }
    onActualizado(data)
    return true
  }

  async function guardar(e) {
    e.preventDefault()
    const valido = validar(nombre, precio)
    if (valido.error) {
      setError(valido.error)
      return
    }
    const ok = await actualizar(
      { nombre: valido.nombre, precio: valido.precio },
      'guardar los cambios',
    )
    // Si falla, seguimos en modo edición con lo tipeado.
    if (ok) setEditando(false)
  }

  if (editando) {
    return (
      <li>
        <form className="fila" onSubmit={guardar} onKeyDown={(e) => e.key === 'Escape' && cancelar()}>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Nombre"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="precio-input"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            aria-label="Precio"
          />
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={cancelar} disabled={guardando}>
            Cancelar
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </li>
    )
  }

  return (
    <li>
      <div className="fila">
        <button
          type="button"
          className="editable"
          onClick={empezarEdicion}
          title="Click para editar"
        >
          <span className="nombre">{producto.nombre}</span>
          <span className="precio">{formatoPrecio.format(producto.precio)}</span>
        </button>
        <button type="button" onClick={empezarEdicion}>
          Editar
        </button>
        <button
          type="button"
          onClick={() => actualizar({ activo: false }, 'desactivar el producto')}
          disabled={guardando}
        >
          {guardando ? 'Desactivando…' : 'Desactivar'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </li>
  )
}

function FilaDesactivado({ producto, onActualizado }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  async function reactivar() {
    setGuardando(true)
    setError(null)
    const { data, error } = await supabase
      .from('productos')
      .update({ activo: true })
      .eq('id', producto.id)
      .select()
      .single()
    setGuardando(false)
    if (error) setError(mensajeError('reactivar el producto', error))
    else onActualizado(data)
  }

  return (
    <li>
      <div className="fila">
        <span className="nombre">
          {producto.nombre} <span className="vacio">({producto.categoria})</span>
        </span>
        <span className="precio">{formatoPrecio.format(producto.precio)}</span>
        <button type="button" onClick={reactivar} disabled={guardando}>
          {guardando ? 'Reactivando…' : 'Reactivar'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </li>
  )
}

export default Catalogo
