// Categorías fijas del menú, en el orden en que se muestran.
// `valor` es lo que se guarda en productos.categoria y tiene que coincidir
// exactamente con el CHECK constraint de la base. `label` es lo que se ve en
// pantalla.
export const CATEGORIAS = [
  { valor: 'pizzas', label: 'Pizzas' },
  { valor: 'empanadas', label: 'Empanadas' },
  { valor: 'bebidas_con_alcohol', label: 'Bebidas con alcohol' },
  { valor: 'bebidas_sin_alcohol', label: 'Bebidas sin alcohol' },
  { valor: 'promociones', label: 'Promociones' },
  { valor: 'postres', label: 'Postres' },
]

// Devuelve el label de un valor guardado (o el valor tal cual si no se conoce).
export function labelCategoria(valor) {
  return CATEGORIAS.find((c) => c.valor === valor)?.label ?? valor
}
