import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { CreateAgentData, UpdateAgentData } from "../../../api/agents";

interface AgentFormData {
  name: string;
  description: string;
  systemMessage: string;
  isDefault: boolean;
}

interface AgentFormProps {
  initialData?: Partial<AgentFormData>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

const AgentForm: React.FC<AgentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<AgentFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    systemMessage: initialData?.systemMessage || "",
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Partial<AgentFormData>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        systemMessage: initialData.systemMessage || "",
        isDefault: initialData.isDefault || false,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AgentFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "Description must be less than 200 characters";
    }

    if (!formData.systemMessage.trim()) {
      newErrors.systemMessage = "System message is required";
    } else if (formData.systemMessage.length > 2000) {
      newErrors.systemMessage =
        "System message must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateAgentData | UpdateAgentData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      systemMessage: formData.systemMessage.trim(),
      isDefault: formData.isDefault,
    };

    try {
      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  const handleInputChange = (
    field: keyof AgentFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getCharCount = (text: string, max: number) => {
    const count = text.length;
    const isOverLimit = count > max;
    return (
      <span
        className={`text-xs ${isOverLimit ? "text-red-500" : "text-gray-500"}`}
      >
        {count}/{max}
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name *
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Code Reviewer, Creative Writer"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className={errors.name ? "border-red-500 focus:border-red-500" : ""}
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center">
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          <div className="ml-auto">{getCharCount(formData.name, 100)}</div>
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Input
          id="description"
          type="text"
          placeholder="Brief description of this agent's purpose (optional)"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={
            errors.description ? "border-red-500 focus:border-red-500" : ""
          }
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center">
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
          <div className="ml-auto">
            {getCharCount(formData.description, 200)}
          </div>
        </div>
      </div>

      {/* System Message Field */}
      <div className="space-y-2">
        <Label htmlFor="systemMessage" className="text-sm font-medium">
          System Message *
        </Label>
        <textarea
          id="systemMessage"
          rows={8}
          placeholder="Enter the system message that defines how this agent should behave..."
          value={formData.systemMessage}
          onChange={(e) => handleInputChange("systemMessage", e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            errors.systemMessage
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300"
          }`}
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center">
          {errors.systemMessage && (
            <p className="text-sm text-red-500">{errors.systemMessage}</p>
          )}
          <div className="ml-auto">
            {getCharCount(formData.systemMessage, 2000)}
          </div>
        </div>
      </div>

      {/* Default Agent Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) => handleInputChange("isDefault", checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="isDefault" className="text-sm font-medium">
          Set as default agent
        </Label>
      </div>
      <p className="text-xs text-gray-500 ml-6">
        The default agent will be automatically selected when you start a new
        conversation.
      </p>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEditing ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{isEditing ? "Update Agent" : "Create Agent"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AgentForm;
