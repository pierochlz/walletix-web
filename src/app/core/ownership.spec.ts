import { onlyOwn } from './ownership';

describe('onlyOwn', () => {
  const records = [
    { id: 1, idUsuario: 3 },
    { id: 2, idUsuario: 7 },
    { id: 3, idUsuario: 3 },
  ];

  it('keeps only the records of the logged-in user (an ADMIN receives everyone)', () => {
    expect(onlyOwn(records, 3).map((r) => r.id)).toEqual([1, 3]);
  });

  it('shows nothing while the user is still loading, never other people\'s data', () => {
    expect(onlyOwn(records, undefined)).toEqual([]);
  });
});
