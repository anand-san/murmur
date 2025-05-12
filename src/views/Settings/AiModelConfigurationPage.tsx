import React, { useEffect, useState } from "react";
import {
  getProviders as getProvidersApi, // Renamed to avoid conflict with local fetchProviders
  deleteProvider,
  getModelsByProviderId,
  deleteModel as deleteModelApiCall,
  setDefaultModelApi,
  Provider, // Import the Provider type
} from "../../api/config/config";
// import { ModelProvider } from "../AiInteraction/utils/types"; // Not directly used here, DisplayProvider is more specific
import { Button } from "../../components/ui/button";
import AddEditProviderModal from "./AddEditProviderModal"; // Import the modal
import AddEditModelModal from "./AddEditModelModal"; // Import the new model modal
import { ProviderData, ProviderModel } from "../../api/config/config"; // For the editingProvider state type, ProviderModel for editingModel
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"; // Import AlertDialog components

// This type is based on what getModelRegistry returns for each provider
// It's slightly different from ModelProvider if ModelProvider has an SDK ID for provider itself
// For now, let's assume the `providerName` is unique and can act as an identifier for display/selection
// Or, the backend `FormattedProvider` should ideally include the provider's database ID.
// Let's adjust based on the actual data structure from getModelRegistry.
// The `getModelRegistry` in `config.ts` returns:
// { availableModels: Array<{ image: string | null; providerName: string; models: Array<{ id: string; name: string; }> }> }
// So, the type for a single provider item in our list will be:
type DisplayProvider = {
  id: number;
  image: string | null;
  providerName: string;
  providerSdkId: string;
  baseUrl: string | null;
  // modelsCount is removed as getProvidersApi doesn't return it directly
};

// This type is now more aligned with what AddEditProviderModal expects for 'provider' prop
type EditableProvider = Partial<ProviderData> & {
  id: number;
  // providerName is not directly part of ProviderData, but useful for modal title or context
  // The modal primarily uses fields from ProviderData (name, provider_sdk_id, etc.)
};

// ModelDetails type is no longer needed here, as we will use ProviderModel from config.ts

const AiModelConfigurationPage: React.FC = () => {
  const [providers, setProviders] = useState<DisplayProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Overall loading for providers
  const [error, setError] = useState<string | null>(null); // Overall error for providers

  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<
    EditableProvider | undefined
  >(undefined);
  const [providerToDelete, setProviderToDelete] =
    useState<DisplayProvider | null>(null);

  const [selectedProvider, setSelectedProvider] =
    useState<DisplayProvider | null>(null);
  const [selectedProviderModels, setSelectedProviderModels] = useState<
    ProviderModel[] // Use ProviderModel here
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [isAddEditModelModalOpen, setIsAddEditModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ProviderModel | null>(null); // Use ProviderModel here
  const [modelToDelete, setModelToDelete] = useState<ProviderModel | null>(
    null
  );

  const handleSetDefaultModel = async (modelId: number) => {
    if (!selectedProvider) return;
    // Add a loading state for this specific action if desired
    // e.g., setIsLoadingSetDefault(true);
    try {
      await setDefaultModelApi(modelId);
      // Refresh models for the current provider to show the new default status
      fetchModelsForProvider(selectedProvider.id);
      // Optionally, refresh all providers if the default model
      // affects something in the main provider list (e.g., a global default indicator)
      // This might be good to ensure the "modelsCount" or any default indicators
      // on the provider list itself are updated.
      fetchProviders();
      // toast.success("Model set as default successfully!"); // Consider adding toast notifications
    } catch (err: any) {
      setModelsError(err.message || "Failed to set default model");
      // toast.error(err.message || "Failed to set default model");
    } finally {
      // setIsLoadingSetDefault(false);
    }
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawProviders: Provider[] = await getProvidersApi();
      // Transform the data from Provider[] to DisplayProvider[]
      const displayableProviders: DisplayProvider[] = rawProviders.map((p) => ({
        id: p.id,
        providerName: p.name, // map 'name' from Provider to 'providerName'
        providerSdkId: p.provider_sdk_id, // map 'provider_sdk_id'
        baseUrl: p.base_url, // map 'base_url'
        image: p.image_url, // map 'image_url' to 'image'
        // modelsCount is no longer available here
      }));
      setProviders(displayableProviders);
    } catch (err: any) {
      setError(err.message || "Failed to fetch providers");
      setProviders([]);
      setSelectedProvider(null); // Clear selected provider on error
      setSelectedProviderModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModelsForProvider = async (providerId: number) => {
    if (!providerId) return;
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      // getModelsByProviderId is expected to return ProviderModel[]
      const models = await getModelsByProviderId(providerId);
      setSelectedProviderModels(models); // No cast needed if types align
    } catch (err: any) {
      setModelsError(err.message || "Failed to fetch models for this provider");
      setSelectedProviderModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Fetch models when a provider is selected
  useEffect(() => {
    if (selectedProvider) {
      fetchModelsForProvider(selectedProvider.id);
    } else {
      setSelectedProviderModels([]); // Clear models if no provider is selected
    }
  }, [selectedProvider]);

  if (isLoading) {
    return <div className="p-4">Loading AI model configurations...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading configurations: {error}
        <Button onClick={fetchProviders} className="ml-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">AI Model Configuration</h1>
        <Button
          onClick={() => {
            setEditingProvider(undefined); // Clear any editing state
            setIsAddProviderModalOpen(true);
          }}
        >
          Add New Provider
        </Button>
      </div>
      <p className="mb-6 text-muted-foreground">
        Manage your AI model providers and their respective models here.
      </p>

      <div className="mt-6 p-4 border rounded-lg bg-card shadow">
        <h2 className="text-xl font-semibold mb-3 text-card-foreground">
          Providers
        </h2>
        {providers.length === 0 ? (
          <p className="text-muted-foreground">No providers configured yet.</p>
        ) : (
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li
                key={provider.id}
                className={`p-3 border rounded-md flex justify-between items-center cursor-pointer hover:bg-muted/50 ${
                  selectedProvider?.id === provider.id
                    ? "bg-muted ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center space-x-3">
                    {provider.image && (
                      <img
                        src={provider.image}
                        alt={provider.providerName}
                        className="w-8 h-8 rounded-sm object-contain"
                      />
                    )}
                    <span className="font-medium">{provider.providerName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-11">
                    SDK ID: {provider.providerSdkId}
                  </span>
                  {/* modelsCount display removed */}
                </div>
                <div className="space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Construct the object for the modal, mapping DisplayProvider fields
                      // to what AddEditProviderModal expects (ProviderData fields)
                      const providerToEdit: EditableProvider = {
                        id: provider.id,
                        name: provider.providerName, // map providerName to name
                        provider_sdk_id: provider.providerSdkId,
                        base_url: provider.baseUrl,
                        image_url: provider.image, // map image to image_url
                        // api_key is intentionally omitted for editing;
                        // modal handles it as "leave blank to keep unchanged"
                      };
                      setEditingProvider(providerToEdit);
                      setIsAddProviderModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setProviderToDelete(provider)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAddProviderModalOpen && (
        <AddEditProviderModal
          isOpen={isAddProviderModalOpen}
          onClose={() => {
            setIsAddProviderModalOpen(false);
            setEditingProvider(undefined);
          }}
          onSave={() => {
            fetchProviders(); // Refresh list after save
            setIsAddProviderModalOpen(false);
            setEditingProvider(undefined);
          }}
          provider={editingProvider}
        />
      )}

      {providerToDelete && (
        <AlertDialog
          open={!!providerToDelete}
          onOpenChange={() => setProviderToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                provider "{providerToDelete.providerName}" and all its
                associated models.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProviderToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (providerToDelete) {
                    try {
                      await deleteProvider(providerToDelete.id);
                      fetchProviders(); // Refresh the list
                      setProviderToDelete(null); // Close the dialog
                    } catch (err: any) {
                      setError(err.message || "Failed to delete provider");
                      // Optionally, keep the dialog open or show error in a toast
                      setProviderToDelete(null); // Close dialog even on error for now
                    }
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Model Management Section */}
      {selectedProvider && (
        <div className="mt-8 p-4 border rounded-lg bg-card shadow">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-card-foreground">
              Models for {selectedProvider.providerName}
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingModel(null); // For adding a new model
                setIsAddEditModelModalOpen(true);
              }}
            >
              Add Model
            </Button>
          </div>

          {isLoadingModels && <p>Loading models...</p>}
          {modelsError && <p className="text-red-500">Error: {modelsError}</p>}
          {!isLoadingModels &&
            !modelsError &&
            selectedProviderModels.length === 0 && (
              <p className="text-muted-foreground">
                No models configured for this provider yet.
              </p>
            )}
          {!isLoadingModels &&
            !modelsError &&
            selectedProviderModels.length > 0 && (
              <ul className="space-y-2">
                {selectedProviderModels.map((model) => (
                  <li
                    key={model.id}
                    className="p-3 border rounded-md flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        SDK ID: {model.model_sdk_id}
                      </span>
                      <span
                        className={`text-xs ${
                          model.is_enabled ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {model.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                      {model.is_default && (
                        <span className="ml-2 text-xs text-blue-600 font-semibold">
                          (Global Default)
                        </span>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingModel(model);
                          setIsAddEditModelModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleSetDefaultModel(model.id);
                        }}
                        disabled={model.is_default} // Disable if already default
                      >
                        {model.is_default ? "Default" : "Set Default"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setModelToDelete(model);
                        }}
                      >
                        Del
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}

      {selectedProvider && isAddEditModelModalOpen && (
        <AddEditModelModal
          isOpen={isAddEditModelModalOpen}
          onClose={() => {
            setIsAddEditModelModalOpen(false);
            setEditingModel(null);
          }}
          onSave={() => {
            if (selectedProvider) {
              fetchModelsForProvider(selectedProvider.id);
            }
            setIsAddEditModelModalOpen(false);
            setEditingModel(null);
          }}
          model={editingModel}
          providerId={selectedProvider.id}
        />
      )}

      {modelToDelete && selectedProvider && (
        <AlertDialog
          open={!!modelToDelete}
          onOpenChange={() => setModelToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                model "{modelToDelete.name}" from provider "
                {selectedProvider.providerName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setModelToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (modelToDelete && selectedProvider) {
                    try {
                      await deleteModelApiCall(modelToDelete.id);
                      fetchModelsForProvider(selectedProvider.id); // Refresh the list
                      setModelToDelete(null); // Close the dialog
                    } catch (err: any) {
                      setModelsError(err.message || "Failed to delete model");
                      setModelToDelete(null);
                    }
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Model
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default AiModelConfigurationPage;
