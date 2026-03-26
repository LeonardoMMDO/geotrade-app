export interface Categoria {
    id: number;
    nombre: string;
    icono: string;
    iconoMapa: string;
    habilitada: boolean;
}

export interface CategoriaPayload {
    nombre: string;
    icono: string;
    iconoMapa: string;
    habilitada?: boolean;
}

export interface ExplorerCategoryItem {
    id: number;
    label: string;
    value: string;
    icon: string;
    mapIcon: string;
    enabled: boolean;
}
