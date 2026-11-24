import { CrudService } from '../core/crud.service';

// Describes one CRUD page (expenses, incomes, ...) so the same table + form can be reused.

export interface SelectOption {
  value: string | number | boolean;
  label: string; // an i18n key when the field has translate: true, otherwise plain text
  icon?: string; // Material icon shown next to the text (e.g. the icon of a category)
  color?: string; // color of that icon
}

export interface FieldDef {
  key: string; // name of the property in the DTO (montoGasto, fechaGasto, ...)
  label: string; // i18n key
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'color' | 'url' | 'icon'; // icon = gallery of icons
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  // Date fields: limits of the date picker as "yyyy-MM-dd" (the API checks the same rule)
  minDate?: () => string;
  maxDate?: () => string;
  options?: () => SelectOption[]; // for selects
  translate?: boolean; // option labels are i18n keys
  inTable?: boolean; // default true
  inForm?: boolean; // default true
  format?: 'currency' | 'date' | 'bool' | 'option' | 'color' | 'icon';
}

export interface ResourceConfig {
  titleKey: string;
  icon: string;
  idKey: string; // idGasto, idIngreso, ...
  service: CrudService<any>;
  fields: FieldDef[];
  defaults?: () => Record<string, unknown>; // values added before saving (e.g. idUsuario)
  initialValues?: () => Record<string, unknown>; // values already chosen in the "New" form
  canEdit?: () => boolean; // default: everyone can create / edit / delete
  noteKey?: string; // message shown when canEdit() is false
  infoKey?: string; // message always shown under the title (explains how the page works)
  // Per row: false hides edit / delete and shows a lock (e.g. default categories for a normal user)
  canEditRow?: (row: Record<string, any>) => boolean;
  lockedKey?: string; // tooltip of that lock
  afterChange?: () => void; // e.g. reload categories after creating one
  // Reads the API response after saving; if it returns a text, it is shown as a warning (e.g. budget alert)
  warningFromResponse?: (response: unknown) => string | null;
}
