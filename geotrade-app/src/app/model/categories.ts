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
  { label: 'Consultorios', value: 'consultorios', icon: 'bi-capsule' },
  { label: 'Servicios a domicilio', value: 'servicios a domicilio', icon: 'bi-house-door-fill' },
  { label: 'Escuelas', value: 'escuelas', icon: 'bi-backpack' },
  { label: 'Hospedajes', value: 'hospedajes', icon: 'bi-building' },
  { label: 'Papelerías', value: 'papelerías', icon: 'bi-book' },
  { label: 'Veterinarias', value: 'veterinarias', icon: 'bi-hospital' },
  // otras categorías que quieras agregar en el futuro
];
