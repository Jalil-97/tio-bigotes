export const formatoPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

export function porNombre(a, b) {
  return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
}

// Convierte errores de Supabase / red en un mensaje entendible.
export function mensajeError(accion, error) {
  if (error?.code === 'PGRST116') {
    return `No se pudo ${accion}: el registro no existe o no hay permiso para modificarlo.`
  }
  if (error?.message?.includes('Failed to fetch')) {
    return `No se pudo ${accion}: no hay conexión con el servidor. Revisá internet y probá de nuevo.`
  }
  return `No se pudo ${accion}: ${error?.message ?? 'error desconocido'}.`
}
