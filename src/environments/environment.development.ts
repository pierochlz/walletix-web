// Development (ng serve): the API running locally from IntelliJ
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  exchangeRatesUrl: 'https://open.er-api.com/v6/latest/PEN',
  // Second third-party API: public holidays in Peru (Nager.Date)
  holidaysUrl: 'https://date.nager.at/api/v3/NextPublicHolidays/PE',
};
