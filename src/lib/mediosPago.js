// Medios de pago aceptados.
// `valor` es lo que se guarda en pedidos.medio_pago y tiene que coincidir
// exactamente con el CHECK constraint de la base. `label` es lo que se ve en
// pantalla.
export const MEDIOS_PAGO = [
  { valor: 'efectivo', label: 'Efectivo' },
  { valor: 'mp_qr', label: 'Mercado Pago - QR' },
  { valor: 'mp_transferencia', label: 'Mercado Pago - Transferencia' },
]
