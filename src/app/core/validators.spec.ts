import { FormControl } from '@angular/forms';
import { maxTwoDecimals } from './validators';

describe('maxTwoDecimals (amounts in soles and cents)', () => {
  const check = (value: unknown) => maxTwoDecimals(new FormControl(value));

  it('accepts whole amounts and amounts with 1 or 2 decimals', () => {
    for (const value of [10, 10.5, 10.55, '25', '0.01', 1000000]) {
      expect(check(value)).toBeNull();
    }
  });

  it('rejects 3 or more decimals (10.555 was saved as 10.56 but the balance subtracted 10.555)', () => {
    for (const value of [10.555, '0.001', 1.005]) {
      expect(check(value)).toEqual({ cents: true });
    }
  });

  it('leaves empty values to the "required" validator', () => {
    expect(check(null)).toBeNull();
    expect(check('')).toBeNull();
  });
});
