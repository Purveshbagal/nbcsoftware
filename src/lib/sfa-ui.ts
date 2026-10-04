/**
 * Declarative descriptions of a field-force list screen. Server components
 * build these and hand them to <EntityTable>, so the shapes have to stay
 * serialisable — no functions.
 */

export type ColumnType =
  | "text"
  | "badge"
  | "date"
  | "number"
  | "currency"
  | "list"
  | "bool";

export type Column = {
  key: string;
  label: string;
  type?: ColumnType;
  /** Hidden on narrow screens when true. */
  secondary?: boolean;
};

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "checkbox"
  | "multiselect";

export type Field = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  section?: string;
  placeholder?: string;
  required?: boolean;
  /** Takes the full dialog width instead of half. */
  wide?: boolean;
};

export type FilterSpec = {
  key: string;
  label: string;
  options: string[];
};

export type EntityRow = Record<string, unknown> & { _id: string };

/** Mongo documents carry ObjectIds and Dates; the client needs plain JSON. */
export function toPlainRows(docs: unknown[]): EntityRow[] {
  return JSON.parse(JSON.stringify(docs)) as EntityRow[];
}
