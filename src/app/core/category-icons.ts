// Icon gallery of the categories (names of Google's Material Icons font).
// The API keeps the chosen name in "urlIconoCategoria", so the database does not change.

export const CATEGORY_ICONS: string[] = [
  // Expenses
  'restaurant', 'local_grocery_store', 'local_cafe', 'directions_bus', 'local_gas_station', 'flight',
  'home', 'bolt', 'water_drop', 'wifi', 'smartphone', 'local_hospital', 'fitness_center', 'spa',
  'school', 'menu_book', 'sports_esports', 'movie', 'music_note', 'celebration', 'shopping_bag',
  'checkroom', 'pets', 'child_care', 'card_giftcard', 'volunteer_activism', 'receipt_long',
  // Incomes
  'payments', 'work', 'laptop', 'trending_up', 'savings', 'attach_money',
  // Generic
  'category',
];

export const DEFAULT_CATEGORY_ICON = 'category';

// Colors of the palette: all of them keep the white check mark readable
export const CATEGORY_COLORS: { hex: string; name: string }[] = [
  { hex: '#EF4444', name: 'color.red' },
  { hex: '#F97316', name: 'color.orange' },
  { hex: '#EAB308', name: 'color.yellow' },
  { hex: '#84CC16', name: 'color.lime' },
  { hex: '#22C55E', name: 'color.green' },
  { hex: '#14B8A6', name: 'color.teal' },
  { hex: '#0EA5E9', name: 'color.sky' },
  { hex: '#3B82F6', name: 'color.blue' },
  { hex: '#6366F1', name: 'color.indigo' },
  { hex: '#A855F7', name: 'color.purple' },
  { hex: '#EC4899', name: 'color.pink' },
  { hex: '#78716C', name: 'color.gray' },
];

// Older categories were saved with an image URL: they show the generic icon
export function categoryIcon(value: string | null | undefined): string {
  return value && CATEGORY_ICONS.includes(value) ? value : DEFAULT_CATEGORY_ICON;
}
