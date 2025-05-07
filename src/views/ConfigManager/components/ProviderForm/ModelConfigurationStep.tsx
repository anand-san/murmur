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

  // Register models field with validation
  React.useEffect(() => {
    // Ensure we register models with validation
    register("models", {
      required: "At least one model is required",
      validate: (value: string) => {
        if (!value || value.trim() === "") {
          return "Please add at least one model";
        }
        return true;
      },
    });
  }, [register]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="models" className="block font-medium">
          Models <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="models"
          {...register("models")}
          placeholder="Enter models (one per line, format: label:value)"
          className={`flex min-h-[150px] w-full rounded-md border ${
            errors.models ? "border-red-400" : "border-input"
          } bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 ${
            errors.models
              ? "focus-visible:ring-red-400"
              : "focus-visible:ring-ring"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        />
        {errors.models && (
          <p className="text-sm text-red-500 mt-1">{errors.models.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Enter one model per line in the format "label:value".
          <br />
          Example: <code className="bg-gray-100 px-1 rounded">GPT-4:gpt-4</code>
          ,{" "}
          <code className="bg-gray-100 px-1 rounded">
            Claude 3:claude-3-opus-20240229
          </code>
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 mt-2 bg-gray-50 rounded-md">
        <div className="pt-0.5">
          <Switch
            id="isDefault"
            checked={watch("isDefault")}
            onCheckedChange={(checked) => setValue("isDefault", checked)}
          />
        </div>
        <div>
          <Label htmlFor="isDefault" className="font-medium">
            Set as default provider
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            This provider will be automatically selected when you open the app
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Previous
        </Button>

        <div className="text-sm">
          {errors.models && (
            <span className="text-amber-600">
              Please define at least one model
            </span>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              {isEditMode ? "Update" : "Save"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ModelConfigurationStep;
