import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded ${
              index + 1 <= currentStep ? "bg-primary" : "bg-gray-200"
            } ${index + 1 < totalSteps ? "mr-2" : ""}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-sm">
        {steps.map((step, index) => (
          <span
            key={index}
            className={
              currentStep >= index + 1
                ? "text-primary font-medium"
                : "text-gray-500"
            }
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
