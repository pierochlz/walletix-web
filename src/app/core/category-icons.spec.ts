import { CATEGORY_COLORS, CATEGORY_ICONS, categoryIcon, DEFAULT_CATEGORY_ICON } from './category-icons';
import { EN_US } from './i18n/en-us';
import { ES_419 } from './i18n/es-419';

describe('category icons and colors', () => {
  it('uses the chosen icon when it is in the gallery', () => {
    expect(categoryIcon('pets')).toBe('pets');
  });

  it('shows the generic icon for old categories saved with an image URL', () => {
    expect(categoryIcon('https://iconos.test/comida.png')).toBe(DEFAULT_CATEGORY_ICON);
    expect(categoryIcon(null)).toBe(DEFAULT_CATEGORY_ICON);
  });

  it('has a name in both languages for every icon and color (accessibility: screen readers read it)', () => {
    const keys = [...CATEGORY_ICONS.map((i) => `icon.${i}`), ...CATEGORY_COLORS.map((c) => c.name), 'color.current'];
    for (const key of keys) {
      expect(ES_419[key], `es-419 ${key}`).toBeTruthy();
      expect(EN_US[key], `en-US ${key}`).toBeTruthy();
    }
  });

  it('has no repeated icons or colors', () => {
    expect(new Set(CATEGORY_ICONS).size).toBe(CATEGORY_ICONS.length);
    expect(new Set(CATEGORY_COLORS.map((c) => c.hex)).size).toBe(CATEGORY_COLORS.length);
  });
});
