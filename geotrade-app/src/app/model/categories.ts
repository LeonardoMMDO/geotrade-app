export interface CategoryItem {
  label: string;
  value: string;
  icon?: string;      // optional bootstrap icon class for UI
}

// keep values in lowercase for consistency with search and storage
export const CATEGORIES: CategoryItem[] = [
  { label: 'Restaurantes', value: 'restaurantes', icon: 'bi-fork-knife' },
  { label: 'Refaccionarias', value: 'refaccionarias', icon: 'bi-car-front-fill' },
  { label: 'Estética', value: 'estética', icon: 'bi-scissors' },
  { label: 'Abarrotes', value: 'abarrotes', icon: 'bi-cart' },
  { label: 'Farmacias', value: 'farmacias', icon: 'bi-capsule' },
  { label: 'Gym', value: 'gym', icon: 'bi-heart-pulse' },
  { label: 'Florería', value: 'floreria', icon: 'bi-flower3' },
  { label: 'Boutique', value: 'boutique', icon: 'bi-handbag' },
  { label: 'Papelerías', value: 'papelerías', icon: 'bi-book' },
  { label: 'Veterinarias', value: 'veterinarias', icon: 'bi-hospital' },
  // otras categorías que quieras agregar en el futuro
];
