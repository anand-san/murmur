import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type Provider,
  type CreateProviderInput,
  getProviderById,
  createProvider,
  updateProvider,
} from "../../../../api/config/providers";

import { FormData, parseModels } from "./types";
import ProviderDetailsStep from "./ProviderDetailsStep";
import ConnectionSettingsStep from "./ConnectionSettingsStep";
import ModelConfigurationStep from "./ModelConfigurationStep";
import StepIndicator from "./StepIndicator";

// Form validation schema
const formSchema = z.object({
  providerName: z.string().min(1, "Provider name is required"),
  nickName: z.string().min(1, "Nickname is required"),
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().optional(), // Allow any string format
  models: z.string().min(1, "At least one model is required"),
  isDefault: z.boolean().default(false),
});

// Step titles
const STEPS = [
  "Provider Details",
  "Connection Settings",
  "Model Configuration",
];

const ProviderForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const queryClient = useQueryClient();

  // Determine model type from URL parameter
  const modelType = (
    type === "speech"
      ? "speech"
      : type === "image"
      ? "image"
      : window.location.pathname.includes("speech")
      ? "speech"
      : window.location.pathname.includes("image")
      ? "image"
      : "chat"
  ) as "chat" | "speech" | "image";

  // Create provider mutation
  const createMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      toast.success("Provider created successfully");
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      navigate("/");
    },
    onError: (error) => {
      toast.error("Failed to create provider: " + error.message);
    },
  });

  // Update provider mutation
  const updateMutation = useMutation({
    mutationFn: updateProvider,
    onSuccess: () => {
      toast.success("Provider updated successfully");
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      navigate("/");
    },
    onError: (error) => {
      toast.error("Failed to update provider: " + error.message);
    },
  });

  // Fetch provider details if in edit mode
  const { data: providerData, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => getProviderById(id || ""),
    enabled: isEditMode,
  });

  const provider = providerData?.provider as Provider | undefined;

  // Setup form with React Hook Form
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema) as any, // Type cast to fix type incompatibility
    defaultValues: {
      providerName: "",
      nickName: "",
      apiKey: "",
      baseUrl: "",
      models: "",
      isDefault: false,
    },
    mode: "onChange", // Validate on change for better user experience
  });

  const {
    handleSubmit,
    setValue,
    trigger,
    formState: { isSubmitting, errors },
  } = methods;

  // Update form values when provider data is loaded
  useEffect(() => {
    if (provider) {
      setValue("providerName", provider.providerName);
      setValue("nickName", provider.nickName);
      setValue("apiKey", provider.apiKey);
      setValue("baseUrl", provider.baseUrl || "");
      setValue(
        "models",
        provider.availableModels
          ? provider.availableModels
              .map((model) => `${model.label}:${model.value}`)
              .join("\n")
          : ""
      );
      setValue("isDefault", provider.default);
    }
  }, [provider, setValue]);

  // Form submission handler - only used on final step
  const handleFinalSubmit = async (data: FormData) => {
    try {
      console.log("Submitting final form data:", data);

      // Parse models from text input
      const availableModels = parseModels(data.models);

      if (isEditMode && id) {
        // Update existing provider
        await updateMutation.mutateAsync({
          id,
          data: {
            apiKey: data.apiKey,
            baseUrl: data.baseUrl || undefined,
            nickName: data.nickName,
            availableModels,
            default: data.isDefault,
          },
        });
      } else {
        // Create new provider
        await createMutation.mutateAsync({
          providerName: data.providerName,
          nickName: data.nickName,
          apiKey: data.apiKey,
          baseUrl: data.baseUrl || undefined,
          availableModels,
          modelType: modelType,
          default: data.isDefault,
        } as CreateProviderInput);
      }
    } catch (error) {
      console.error("Error submitting provider:", error);
      toast.error(
        `Submission error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    }
  };

  // Validate and proceed to next step
  const handleNext = async () => {
    console.log("Next button clicked, current step:", step);
    let fieldsToValidate: string[] = [];

    if (step === 1) {
      fieldsToValidate = ["providerName", "nickName"];
    } else if (step === 2) {
      fieldsToValidate = ["apiKey"];
    }

    console.log("Validating fields:", fieldsToValidate);
    const isStepValid = await methods.trigger(fieldsToValidate as any);
    console.log("Step validation result:", isStepValid);

    if (isStepValid) {
      console.log("Step validation passed, proceeding to next step");
      setStep((prevStep) => prevStep + 1);
    } else {
      console.log("Step validation failed:", methods.formState.errors);
      // Show error messages
      if (step === 1) {
        if (methods.formState.errors.providerName) {
          toast.error("Please select a provider");
        } else if (methods.formState.errors.nickName) {
          toast.error("Please enter a nickname");
        } else {
          toast.error("Please fill in all required fields");
        }
      } else if (step === 2) {
        if (methods.formState.errors.apiKey) {
          toast.error("Please enter a valid API key");
        } else {
          toast.error("Please fill in all required fields");
        }
      }
    }
  };

  const handleBack = () => {
    console.log("Going back from step:", step);
    setStep((prevStep) => prevStep - 1);
  };

  const handleGoBack = () => navigate("/");

  // Loading state
  if (isEditMode && isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Loading provider details...</p>
      </div>
    );
  }

  const title = isEditMode
    ? `Edit ${provider?.providerName}`
    : "Add New Provider";

  return (
    <div className="bg-background p-4 pt-12 w-full">
      <div className="ml-2 mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <StepIndicator currentStep={step} totalSteps={3} steps={STEPS} />

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit((data) => {
            console.log("Form submission", { step, data });
            if (step === 3) {
              // Only handle actual submission on the last step
              return handleFinalSubmit(data);
            } else {
              // For other steps, just handle navigation
              handleNext();
              return false; // Prevent actual form submission
            }
          })}
          className="space-y-6 max-w-2xl mx-auto"
        >
          {/* Step 1: Provider Details */}
          {step === 1 && (
            <ProviderDetailsStep
              formMethods={methods}
              onNext={handleNext}
              isEditMode={isEditMode}
              provider={provider}
            />
          )}

          {/* Step 2: Connection Settings */}
          {step === 2 && (
            <ConnectionSettingsStep
              formMethods={methods}
              onNext={handleNext}
              onPrevious={handleBack}
            />
          )}

          {/* Step 3: Model Configuration */}
          {step === 3 && (
            <ModelConfigurationStep
              formMethods={methods}
              onPrevious={handleBack}
              isSubmitting={isSubmitting}
              isEditMode={isEditMode}
            />
          )}
        </form>
      </FormProvider>
    </div>
  );
};

export default ProviderForm;
