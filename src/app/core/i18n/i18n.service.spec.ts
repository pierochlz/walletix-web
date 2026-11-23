import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('translates a key to English and to Latin American Spanish', () => {
    service.setLang('en');
    expect(service.t('nav.expenses')).toBe('Expenses');
    service.setLang('es');
    expect(service.t('nav.expenses')).toBe('Gastos');
  });

  it('replaces the {params} of the text', () => {
    service.setLang('en');
    expect(service.t('dashboard.hello', { name: 'Piero' })).toBe('Hello, Piero');
  });

  it('returns the key when it does not exist', () => {
    expect(service.t('does.not.exist')).toBe('does.not.exist');
  });

  it('uses the locale codes en-US and es-419', () => {
    service.setLang('es');
    expect(service.locale()).toBe('es-419');
    service.setLang('en');
    expect(service.locale()).toBe('en-US');
  });

  it('has the same keys in both languages', async () => {
    const { EN_US } = await import('./en-us');
    const { ES_419 } = await import('./es-419');
    expect(Object.keys(ES_419).sort()).toEqual(Object.keys(EN_US).sort());
  });
});
