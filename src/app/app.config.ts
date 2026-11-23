import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEs419 from '@angular/common/locales/es-419';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { authInterceptor } from './core/auth.interceptor';
import { TranslatedPaginatorIntl } from './core/i18n/paginator-intl';

// Number, currency and date formats for Latin American Spanish (en-US is included by default)
registerLocaleData(localeEs419);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HttpClient + the interceptor that adds the JWT token to every request to the API
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl },
  ],
};
