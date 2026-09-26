// Tipos de entrega. `valor` es lo que se guarda en pedidos.tipo_entrega.
export const TIPOS_ENTREGA = [
  { valor: 'retira', label: 'Retira en el local' },
  { valor: 'envio', label: 'Envío a domicilio' },
]

export function labelTipoEntrega(valor) {
  return TIPOS_ENTREGA.find((t) => t.valor === valor)?.label ?? valor
}
