export interface Model {
  id: string;
  name: string;
}

export interface ModelsConfig {
  providers: Record<string, ModelsConfigValue>;
  defaultModelId?: string;
}

export interface ModelsConfigValue {
  displayName: string;
  image: string;
  models?: Model[];
}
