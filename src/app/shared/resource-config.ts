import { CrudService } from '../core/crud.service';

// Describes one CRUD page (expenses, incomes, ...) so the same table + form can be reused.

export interface SelectOption {
  value: string | number | boolean;
  label: string; // an i18n key when the field has translate: true, otherwise plain text
}

export interface FieldDef {
  key: string; // name of the property in the DTO (montoGasto, fechaGasto, ...)
  label: string; // i18n key
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'color' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  options?: () => SelectOption[]; // for selects
  translate?: boolean; // option labels are i18n keys
  inTable?: boolean; // default true
  inForm?: boolean; // default true
  format?: 'currency' | 'date' | 'bool' | 'option' | 'color';
}

export interface ResourceConfig {
  titleKey: string;
  icon: string;
  idKey: string; // idGasto, idIngreso, ...
  service: CrudService<any>;
  fields: FieldDef[];
  defaults?: () => Record<string, unknown>; // values added before saving (e.g. idUsuario)
  canEdit?: () => boolean; // default: everyone can create / edit / delete
  noteKey?: string; // message shown when canEdit() is false
  afterChange?: () => void; // e.g. reload categories after creating one
  // Reads the API response after saving; if it returns a text, it is shown as a warning (e.g. budget alert)
  warningFromResponse?: (response: unknown) => string | null;
}
