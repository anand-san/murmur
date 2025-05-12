import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import {
  ProviderData,
  createProvider,
  updateProvider,
} from "../../api/config/config";

interface AddEditProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // To trigger a refresh on the parent page
  provider?: Partial<ProviderData> & { id?: number }; // Existing provider data for editing
}

const AddEditProviderModal: React.FC<AddEditProviderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  provider,
}) => {
  const [formData, setFormData] = useState<ProviderData>({
    name: "",
    provider_sdk_id: "",
    api_key: "",
    base_url: "",
    image_url: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || "",
        provider_sdk_id: provider.provider_sdk_id || "",
        api_key: provider.api_key || "", // API key might not be pre-filled for security
        base_url: provider.base_url || "",
        image_url: provider.image_url || "",
      });
    } else {
      // Reset for "Add New"
      setFormData({
        name: "",
        provider_sdk_id: "",
        api_key: "",
        base_url: "",
        image_url: "",
      });
    }
  }, [provider, isOpen]); // Reset form when provider or isOpen changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (provider && provider.id) {
        // Update existing provider
        await updateProvider(provider.id, formData);
      } else {
        // Create new provider
        await createProvider(formData);
      }
      onSave(); // Trigger refresh and close
    } catch (err: any) {
      setError(err.message || "Failed to save provider");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {provider && provider.id ? "Edit Provider" : "Add New Provider"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider_sdk_id" className="text-right">
                SDK ID
              </Label>
              <Input
                id="provider_sdk_id"
                name="provider_sdk_id"
                value={formData.provider_sdk_id}
                onChange={handleChange}
                className="col-span-3"
                required
                placeholder="e.g., openai, groq"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">
                API Key
              </Label>
              <Input
                id="api_key"
                name="api_key"
                type="password" // For security
                value={formData.api_key}
                onChange={handleChange}
                className="col-span-3"
                required={!provider?.id} // API key required for new, optional for edit if already set
                placeholder={
                  provider?.id ? "Leave blank to keep unchanged" : ""
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="base_url" className="text-right">
                Base URL
              </Label>
              <Input
                id="base_url"
                name="base_url"
                value={formData.base_url || ""}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Optional, e.g., for self-hosted"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">
                Image URL
              </Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url || ""}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Optional, e.g., /images/providers/custom.png"
              />
            </div>
            {error && (
              <p className="col-span-4 text-red-500 text-sm">{error}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Provider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditProviderModal;
