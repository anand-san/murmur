import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { ModelProvider } from "../utils/types";
import { getModelRegistry } from "../../../api/config/config"; // Import the new API client function

interface ModelSelectionContextType {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  modelProviders: ModelProvider[];
  isModelSheetOpen: boolean;
  setIsModelSheetOpen: (isOpen: boolean) => void;
  getModelNameById: (id: string) => string | undefined;
  isLoading: boolean;
  fetchError: string | null;
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
  const [selectedModelId, setSelectedModelId] = useState<string>(""); // Initialize empty
  const [modelProviders, setModelProviders] = useState<ModelProvider[]>([]); // Initialize empty
  const [isModelSheetOpen, setIsModelSheetOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistry = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await getModelRegistry(); // Use the Hono RPC client function
        // The backend now returns { availableModels: FormattedProvider[], defaultModelId: string | null }
        if (data && data.availableModels) {
          setModelProviders(data.availableModels);
          if (data.defaultModelId) {
            setSelectedModelId(data.defaultModelId);
          } else if (
            data.availableModels.length > 0 &&
            data.availableModels[0].models.length > 0
          ) {
            // Fallback to the first model of the first provider if no default is set
            setSelectedModelId(data.availableModels[0].models[0].id);
          } else {
            setSelectedModelId(""); // No models available
          }
        } else {
          throw new Error("Invalid data format received from model registry");
        }
      } catch (error: any) {
        console.error("Error fetching model registry:", error);
        setFetchError(error.message || "An unknown error occurred");
        setModelProviders([]); // Clear providers on error
        setSelectedModelId(""); // Clear selected model on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistry();
  }, []);

  const getModelNameById = (id: string): string | undefined => {
    for (const provider of modelProviders) {
      // Use state variable
      const model = provider.models.find((m) => m.id === id);
      if (model) {
        return model.name;
      }
    }
    return undefined;
  };

  const value = {
    selectedModelId,
    setSelectedModelId,
    modelProviders, // Use state variable
    isModelSheetOpen,
    setIsModelSheetOpen,
    getModelNameById,
    isLoading,
    fetchError,
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
