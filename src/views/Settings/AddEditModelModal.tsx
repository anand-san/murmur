import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  ModelData,
  ProviderModel,
  createModel,
  updateModel,
} from "../../api/config/config";
import { toast } from "sonner";

interface AddEditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  model?: ProviderModel | null; // For editing
  providerId: number;
}

const AddEditModelModal: React.FC<AddEditModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  model,
  providerId,
}) => {
  const [name, setName] = useState("");
  const [modelSdkId, setModelSdkId] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  // is_default is handled by a separate API call, so not directly editable here
  // but we might want to display it if editing.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setModelSdkId(model.model_sdk_id);
      setIsEnabled(model.is_enabled);
    } else {
      // Reset for new model
      setName("");
      setModelSdkId("");
      setIsEnabled(true);
    }
    setError(null); // Reset error when model or isOpen changes
  }, [model, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim() || !modelSdkId.trim()) {
      setError("Model Name and Model SDK ID are required.");
      setIsLoading(false);
      return;
    }

    const modelPayload: ModelData = {
      name,
      model_sdk_id: modelSdkId,
      provider_id: providerId,
      is_enabled: isEnabled,
      // is_default will be false by default on creation, or handled by setDefaultModelApi
    };

    try {
      if (model) {
        // Update existing model
        // We only send fields that can be updated. `provider_id` is not updatable.
        // `is_default` is handled by a separate API.
        const updatePayload: Partial<ModelData> = {
          name,
          model_sdk_id: modelSdkId,
          is_enabled: isEnabled,
        };
        await updateModel(model.id, updatePayload);
        toast.success(`Model "${name}" updated successfully.`);
      } else {
        // Create new model
        await createModel(modelPayload);
        toast.success(`Model "${name}" created successfully.`);
      }
      onSave();
      onClose();
    } catch (err: any) {
      const errorMessage =
        err.message ||
        (model ? "Failed to update model" : "Failed to create model");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{model ? "Edit Model" : "Add New Model"}</DialogTitle>
          <DialogDescription>
            {model
              ? `Update the details for ${model.name}.`
              : "Add a new model to this provider."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model-name" className="text-right">
                Name
              </Label>
              <Input
                id="model-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., GPT-4o Mini"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model-sdk-id" className="text-right">
                SDK ID
              </Label>
              <Input
                id="model-sdk-id"
                value={modelSdkId}
                onChange={(e) => setModelSdkId(e.target.value)}
                className="col-span-3"
                placeholder="e.g., openai:gpt-4o-mini"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model-is-enabled" className="text-right">
                Enabled
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="model-is-enabled"
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                  disabled={isLoading}
                />
              </div>
            </div>
            {model?.is_default && (
              <p className="col-span-4 text-sm text-center text-blue-600 font-semibold">
                This model is currently the global default.
              </p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? model
                  ? "Saving..."
                  : "Creating..."
                : model
                ? "Save Changes"
                : "Create Model"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditModelModal;
