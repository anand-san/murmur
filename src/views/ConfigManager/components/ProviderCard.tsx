import React from "react";
import { cn } from "../../../lib/utils";

export interface ProviderCardProps {
  name: string;
  imageSrc: string;
  onClick?: () => void;
  className?: string;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  imageSrc,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-between rounded-lg p-4 cursor-pointer transition-all",
        "border border-gray-200 hover:border-gray-700 min-h-[120px]",
        className
      )}
    >
      <div className="relative w-full flex justify-center">
        <div className="flex items-center justify-center h-14 w-14 mb-2">
          <img
            src={imageSrc}
            alt={`${name} logo`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-lg font-medium">{name}</span>
      </div>
    </div>
  );
};

export default ProviderCard;
