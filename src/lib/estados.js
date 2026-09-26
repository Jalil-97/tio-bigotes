// Estados del pedido. `valor` es lo que se guarda en pedidos.estado.
export const ESTADOS = [
  { valor: 'pendiente', label: 'Pendiente' },
  { valor: 'en_preparacion', label: 'En preparación' },
  { valor: 'listo_para_retirar', label: 'Listo para retirar' },
  { valor: 'en_envio', label: 'En envío' },
  { valor: 'cerrado', label: 'Cerrado' },
]

export function labelEstado(valor) {
  return ESTADOS.find((e) => e.valor === valor)?.label ?? valor
}

// Siguiente estado válido para un pedido, o null si no hay (cerrado).
// Después de "en_preparacion" el camino depende del tipo de entrega.
export function siguienteEstado({ estado, tipo_entrega }) {
  switch (estado) {
    case 'pendiente':
      return 'en_preparacion'
    case 'en_preparacion':
      if (tipo_entrega === 'retira') return 'listo_para_retirar'
      if (tipo_entrega === 'envio') return 'en_envio'
      return null
    case 'listo_para_retirar':
    case 'en_envio':
      return 'cerrado'
    default:
      return null
  }
}
