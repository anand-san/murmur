import React from "react";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { StepProps, PROVIDER_OPTIONS } from "./types";
import ProviderCard from "../ProviderCard";

const ProviderDetailsStep: React.FC<StepProps> = ({
  formMethods,
  isEditMode,
  provider,
}) => {
  // Get model type from URL
  const modelType = window.location.pathname.includes("speech")
    ? "speech"
    : window.location.pathname.includes("image")
    ? "image"
    : "chat";

  // Get provider options for current model type
  const providerOptions =
    PROVIDER_OPTIONS[modelType as keyof typeof PROVIDER_OPTIONS];
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = formMethods;

  // Check if can proceed to next step
  const canProceedToNextStep = () => {
    const values = watch();
    console.log("Current form values in canProceedToNextStep:", values);

    const providerName = values.providerName || "";
    const nickName = values.nickName || "";

    const canProceed = providerName !== "" && nickName !== "";
    console.log(
      `Can proceed: ${canProceed}, providerName: ${providerName}, nickName: ${nickName}`
    );

    return canProceed;
  };

  return (
    <div className="space-y-6">
      {!isEditMode ? (
        <div className="space-y-2">
          <Label htmlFor="providerName" className="block mb-2 font-medium">
            Select Provider <span className="text-red-500">*</span>
          </Label>
          <div className="flex space-x-4 py-2 px-1 w-full pb-4 overflow-y-auto no-scrollbar">
            {providerOptions.map((option) => {
              // Check if the provider is "Custom" or another special case
              const isCustomProvider = option.value === "Custom";
              const imagePath = `/images/providers/${option.value.toLowerCase()}.png`;
              const isSelected = watch("providerName") === option.value;

              return (
                <ProviderCard
                  key={option.value}
                  name={option.label}
                  imageSrc={isCustomProvider ? "" : imagePath}
                  onClick={() => {
                    console.log("Setting provider name to:", option.value);
                    setValue("providerName", option.value);
                  }}
                  className={`${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isCustomProvider && (
                    <div className="h-14 w-14 flex items-center justify-center mb-2 bg-gray-100 rounded-full">
                      <span className="text-2xl">⚙️</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 w-6 h-6 flex items-center justify-center">
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
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </ProviderCard>
              );
            })}
          </div>
          {errors.providerName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.providerName.message}
            </p>
          )}
          {!watch("providerName") && (
            <p className="text-sm text-amber-600 mt-1">
              Please select a provider from the options above
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium pt-2">
            {PROVIDER_OPTIONS[modelType as keyof typeof PROVIDER_OPTIONS].find(
              (option) => option.value === provider?.providerName
            )?.label || provider?.providerName}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nickName" className="block font-medium">
          Nickname <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nickName"
          {...register("nickName", { required: "Nickname is required" })}
          placeholder="Enter a nickname for this provider"
          className={
            errors.nickName ? "border-red-400 focus-visible:ring-red-400" : ""
          }
          onChange={(e) => {
            // Force update the form value
            const value = e.target.value;
            console.log("Setting nickname value:", value);
            setValue("nickName", value);
          }}
        />
        {errors.nickName && (
          <p className="text-sm text-red-500 mt-1">{errors.nickName.message}</p>
        )}
        <p className="text-xs text-gray-500">
          This name will be used to identify this provider in your settings
        </p>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="text-sm">
          {(errors.providerName || errors.nickName) && (
            <span className="text-amber-600">
              Please complete all required fields to continue
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

export default ProviderDetailsStep;
