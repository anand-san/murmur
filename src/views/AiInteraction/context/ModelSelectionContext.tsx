import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { ModelsProvider } from "../utils/types";
import { DEFAULT_MODEL_ID } from "../utils/constants";
import { getAvailableModels } from "../../../api/models";

interface ModelSelectionContextType {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  modelProviders: ModelsProvider;
  isModelSheetOpen: boolean;
  setIsModelSheetOpen: (isOpen: boolean) => void;
  getModelNameById: (id: string) => string | undefined;
  isLoading: boolean;
  error: string | null;
  refetchModels: () => Promise<void>;
}

const ModelSelectionContext = createContext<
  ModelSelectionContextType | undefined
>(undefined);

interface ModelSelectionProviderProps {
  children: ReactNode;
}

export const ModelSelectionProvider: React.FC<ModelSelectionProviderProps> = ({
  children,
}) => {
  const [selectedModelId, setSelectedModelId] =
    useState<string>(DEFAULT_MODEL_ID);
  const [isModelSheetOpen, setIsModelSheetOpen] = useState<boolean>(false);
  const [modelProviders, setModelProviders] = useState<ModelsProvider>({
    providers: {},
    defaultModelId: DEFAULT_MODEL_ID,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const models = await getAvailableModels();
      console.log("Available models:", models);
      setModelProviders(models);

      // Use default model from the response if available and no model is currently selected
      if (models.defaultModelId && selectedModelId === DEFAULT_MODEL_ID) {
        setSelectedModelId(models.defaultModelId);
      }
    } catch (err) {
      console.error("Failed to load models:", err);
      setError(
        "Failed to load available models. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const getModelNameById = (id: string): string | undefined => {
    if (!modelProviders?.providers) return undefined;

    for (const [providerKey, providerConfig] of Object.entries(
      modelProviders.providers
    )) {
      const model = providerConfig.models?.find((m) => m.id === id);
      if (model) {
        return model.name;
      }
    }
    return undefined;
  };

  const value = {
    selectedModelId,
    setSelectedModelId,
    modelProviders,
    isModelSheetOpen,
    setIsModelSheetOpen,
    getModelNameById,
    isLoading,
    error,
    refetchModels: fetchModels,
  };

  return (
    <ModelSelectionContext.Provider value={value}>
      {children}
    </ModelSelectionContext.Provider>
  );
};

export const useModelSelection = (): ModelSelectionContextType => {
  const context = useContext(ModelSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useModelSelection must be used within a ModelSelectionProvider"
    );
  }
  return context;
};
