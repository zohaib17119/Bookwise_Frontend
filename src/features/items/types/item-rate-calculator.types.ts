export interface RateCalculatorFieldDef {
  key: string;
  label: string;
}

export interface RateCalculatorDefinition {
  fields: RateCalculatorFieldDef[];
  formula: string;
}

export interface ItemRateCalculator {
  id: string;
  companyId: string;
  name: string;
  definition: RateCalculatorDefinition;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemRateCalculatorPayload {
  name: string;
  definition: RateCalculatorDefinition;
}
