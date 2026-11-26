import { TestBed } from '@angular/core/testing';
import { readTheme, themeIcon, ThemeService } from './theme.service';

describe('theme (US37)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('starts in light and applies the theme to <html> and saves it', async () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    service.setTheme('dark');
    TestBed.tick();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('walletix_theme')).toBe('dark');
  });

  it('remembers the saved theme and ignores invalid values', () => {
    localStorage.setItem('walletix_theme', 'auto');
    expect(readTheme()).toBe('auto');
    localStorage.setItem('walletix_theme', 'purple');
    expect(readTheme()).toBe('light');
    const service = TestBed.inject(ThemeService);
    service.setTheme('purple' as never);
    expect(service.theme()).toBe('light');
  });

  it('has an icon for each theme', () => {
    expect(themeIcon('light')).toBe('light_mode');
    expect(themeIcon('dark')).toBe('dark_mode');
    expect(themeIcon('auto')).toBe('brightness_auto');
  });
});
