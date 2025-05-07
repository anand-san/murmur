import React from "react";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { StepProps } from "./types";

const ConnectionSettingsStep: React.FC<StepProps> = ({
  formMethods,
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
        <Label htmlFor="apiKey" className="block font-medium">
          API Key <span className="text-red-500">*</span>
        </Label>
        <Input
          id="apiKey"
          type="password"
          {...register("apiKey")}
          placeholder="Enter your API key"
          className={
            errors.apiKey ? "border-red-400 focus-visible:ring-red-400" : ""
          }
        />
        {errors.apiKey && (
          <p className="text-sm text-red-500 mt-1">{errors.apiKey.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Your API key will be stored securely and used to authenticate with the
          provider
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseUrl" className="block font-medium">
          Base URL <span className="text-gray-500">(optional)</span>
        </Label>
        <Input
          id="baseUrl"
          {...register("baseUrl")}
          placeholder="Enter base URL if needed"
          className={
            errors.baseUrl ? "border-red-400 focus-visible:ring-red-400" : ""
          }
        />
        {errors.baseUrl && (
          <p className="text-sm text-red-500 mt-1">{errors.baseUrl.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Custom endpoint URL for self-hosted or proxy services
        </p>
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
          {errors.apiKey && (
            <span className="text-amber-600">
              Please enter your API key to continue
            </span>
          )}
        </div>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Next
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
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default ConnectionSettingsStep;
