import { ModelsConfig } from "../types/models";
import modelsConfigData from "../config/models-config.json";

const modelsConfig = modelsConfigData as ModelsConfig;

class ModelsService {
  async getAvailableModels(): Promise<ModelsConfig> {
    return modelsConfig;
  }
}

export const modelsService = new ModelsService();
