export interface Model {
  id: string;
  name: string;
}

export interface ModelProvider {
  id: number;
  providerName: string;
  providerSdkId: string;
  baseUrl: string | null;
  models: Model[];
  image: string | null;
}
