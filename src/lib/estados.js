// Estados del pedido. `valor` es lo que se guarda en pedidos.estado.
export const ESTADOS = [
  { valor: 'pendiente_pago', label: 'Esperando pago' },
  { valor: 'en_preparacion', label: 'En preparación' },
  { valor: 'listo_para_retirar', label: 'Listo para retirar' },
  { valor: 'en_envio', label: 'En envío' },
  { valor: 'cerrado', label: 'Cerrado' },
]

export function labelEstado(valor) {
  return ESTADOS.find((e) => e.valor === valor)?.label ?? valor
}

// Estado con el que se crea un pedido según el medio de pago: efectivo y QR
// se cobran en el momento; la transferencia queda esperando confirmación.
export function estadoInicial(medioPago) {
  return medioPago === 'mp_transferencia' ? 'pendiente_pago' : 'en_preparacion'
}

// Siguiente estado válido para un pedido, o null si no hay (cerrado).
// Después de "en_preparacion" el camino depende del tipo de entrega.
export function siguienteEstado({ estado, tipo_entrega }) {
  switch (estado) {
    case 'pendiente_pago':
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

// Texto del botón que avanza el pedido al siguiente estado.
export function textoAccion(pedido) {
  if (pedido.estado === 'pendiente_pago') return 'Confirmar pago'
  const siguiente = siguienteEstado(pedido)
  return siguiente ? `Pasar a: ${labelEstado(siguiente)}` : null
}
