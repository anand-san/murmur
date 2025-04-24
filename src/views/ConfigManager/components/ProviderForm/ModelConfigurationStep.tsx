import React from "react";
import { Label } from "../../../../components/ui/label";
import { Button } from "../../../../components/ui/button";
import { Switch } from "../../../../components/ui/switch";
import { StepProps } from "./types";

const ModelConfigurationStep: React.FC<StepProps> = ({
  formMethods,
  onPrevious,
  isSubmitting,
  isEditMode,
}) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = formMethods;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="models">Models</Label>
        <textarea
          id="models"
          {...register("models")}
          placeholder="Enter models (one per line, format: label:value)"
          className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {errors.models && (
          <p className="text-sm text-red-500">{errors.models.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Enter one model per line in the format "label:value". Example:
          "GPT-4:gpt-4"
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="isDefault"
          checked={watch("isDefault")}
          onCheckedChange={(checked) => setValue("isDefault", checked)}
        />
        <Label htmlFor="isDefault">Set as default provider</Label>
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default ModelConfigurationStep;
