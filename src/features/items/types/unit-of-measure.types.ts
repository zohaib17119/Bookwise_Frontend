export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  group?: string | null;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitOfMeasurePayload {
  code: string;
  name: string;
  group?: string;
}
