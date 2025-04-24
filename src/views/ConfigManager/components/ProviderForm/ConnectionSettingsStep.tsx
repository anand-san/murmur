import React from "react";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { StepProps } from "./types";

const ConnectionSettingsStep: React.FC<StepProps> = ({
  formMethods,
  onNext,
  onPrevious,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = formMethods;

  // Check if can proceed to next step
  const canProceedToNextStep = () => {
    const { apiKey } = watch();
    return apiKey !== "";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          type="password"
          {...register("apiKey")}
          placeholder="Enter your API key"
        />
        {errors.apiKey && (
          <p className="text-sm text-red-500">{errors.apiKey.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrl">Base URL (optional)</Label>
        <Input
          id="baseUrl"
          {...register("baseUrl")}
          placeholder="Enter base URL if needed"
        />
        {errors.baseUrl && (
          <p className="text-sm text-red-500">{errors.baseUrl.message}</p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceedToNextStep()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ConnectionSettingsStep;
