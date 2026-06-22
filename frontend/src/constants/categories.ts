export const PRODUCT_CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Limpieza',
  'Electrónica',
  'Hogar',
  'Otros'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
