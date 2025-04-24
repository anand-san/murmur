import React from "react";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { StepProps, PROVIDER_OPTIONS } from "./types";
import ProviderCard from "../ProviderCard";

const ProviderDetailsStep: React.FC<StepProps> = ({
  formMethods,
  onNext,
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
    const { providerName, nickName } = watch();
    return providerName !== "" && nickName !== "";
  };

  return (
    <div className="space-y-6">
      {!isEditMode ? (
        <div className="space-y-2">
          <div className="flex space-x-4 py-2 px-1 w-full pb-4 overflow-y-auto no-scrollbar">
            {providerOptions.map((option) => {
              // Check if the provider is "Custom" or another special case
              const isCustomProvider = option.value === "Custom";
              const imagePath = `/images/providers/${option.value.toLowerCase()}.png`;

              return (
                <ProviderCard
                  key={option.value}
                  name={option.label}
                  imageSrc={isCustomProvider ? "" : imagePath}
                  onClick={() => setValue("providerName", option.value)}
                  className={`${
                    watch("providerName") === option.value
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  {isCustomProvider && (
                    <div className="h-14 w-14 flex items-center justify-center mb-2 bg-gray-100 rounded-full">
                      <span className="text-2xl">⚙️</span>
                    </div>
                  )}
                </ProviderCard>
              );
            })}
          </div>
          {errors.providerName && (
            <p className="text-sm text-red-500">
              {errors.providerName.message}
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
        <Label htmlFor="nickName">Nickname</Label>
        <Input
          id="nickName"
          {...register("nickName")}
          placeholder="Enter a nickname for this provider"
        />
        {errors.nickName && (
          <p className="text-sm text-red-500">{errors.nickName.message}</p>
        )}
      </div>

      <div className="flex justify-end mt-6">
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

export default ProviderDetailsStep;
