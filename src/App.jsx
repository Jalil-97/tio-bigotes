import { useState } from 'react'
import { supabaseConfigError } from './lib/supabaseClient'
import Catalogo from './components/Catalogo'
import NuevoPedido from './components/NuevoPedido'
import PedidosHoy from './components/PedidosHoy'
import './App.css'

const PANTALLAS = [
  { id: 'pedido', label: 'Nuevo pedido' },
  { id: 'hoy', label: 'Pedidos de hoy' },
  { id: 'catalogo', label: 'Catálogo' },
]

function App() {
  const [pantalla, setPantalla] = useState('pedido')

  if (supabaseConfigError) {
    return (
      <div className="pantalla">
        <h1>Error de configuración</h1>
        <p>{supabaseConfigError}</p>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="marca">Tío Bigotes</div>
      </header>
      <nav className="tabs">
        {PANTALLAS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={pantalla === p.id}
            onClick={() => setPantalla(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>
      {pantalla === 'pedido' && <NuevoPedido />}
      {pantalla === 'hoy' && <PedidosHoy />}
      {pantalla === 'catalogo' && <Catalogo />}
    </>
  )
}

export default App
