import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { ResourceConfig } from './resource-config';
import { ResourceFormDialog } from './resource-form-dialog';

// Found in the manual test: the merchant list did not depend on the category, so an expense in
// "Comida" could be saved in "Cineplanet"
describe('ResourceFormDialog (dependent selects)', () => {
  const config = {
    titleKey: 'expenses.title',
    icon: 'shopping_cart',
    idKey: 'idGasto',
    service: {} as never,
    fields: [
      {
        key: 'idCategoria', label: 'expenses.category', type: 'select', required: true,
        options: () => [{ value: 1, label: 'Comida' }, { value: 3, label: 'Entretenimiento' }],
      },
      {
        key: 'idComerciante', label: 'expenses.merchant', type: 'select', required: true, filterBy: 'idCategoria',
        options: () => [
          { value: 10, label: 'Tambo', group: 1 },
          { value: 11, label: 'Wong', group: 1 },
          { value: 20, label: 'Cineplanet', group: 3 },
        ],
      },
    ],
  } as ResourceConfig;

  function create() {
    TestBed.configureTestingModule({
      imports: [ResourceFormDialog],
      providers: [
        provideRouter([]),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: { config, item: null } },
      ],
    });
    return TestBed.createComponent(ResourceFormDialog).componentInstance;
  }

  it('shows only the merchants of the chosen category', () => {
    const dialog = create();
    const merchant = config.fields[1];
    expect(dialog.optionsFor(merchant).map((o) => o.label)).toEqual(['Tambo', 'Wong', 'Cineplanet']); // nothing chosen yet
    dialog.form.get('idCategoria')!.setValue(1);
    expect(dialog.optionsFor(merchant).map((o) => o.label)).toEqual(['Tambo', 'Wong']);
  });

  it('empties the merchant when the new category does not have it', () => {
    const dialog = create();
    dialog.form.get('idCategoria')!.setValue(3);
    dialog.form.get('idComerciante')!.setValue(20); // Cineplanet
    dialog.form.get('idCategoria')!.setValue(1); // changes to Comida
    expect(dialog.form.get('idComerciante')!.value).toBeNull();

    dialog.form.get('idComerciante')!.setValue(10); // Tambo stays when the category does not really change
    dialog.form.get('idCategoria')!.setValue(1);
    expect(dialog.form.get('idComerciante')!.value).toBe(10);
  });
});
