import { supabaseConfigError } from './lib/supabaseClient'
import Catalogo from './components/Catalogo'

function App() {
  if (supabaseConfigError) {
    return (
      <div>
        <h1>Error de configuración</h1>
        <p>{supabaseConfigError}</p>
      </div>
    )
  }

  return <Catalogo />
}

export default App
