import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProviderCard from "./ProviderCard";
import { Provider } from "../../../api/config/providers";
import { Button } from "../../../components/ui/button";
import { getProvidersByType } from "../../../api/config/providers";

// Map of provider IDs to their image paths
const providerImages: Record<string, string> = {
  openai: "/images/providers/openai.png",
  google: "/images/providers/google.png",
  anthropic: "/images/providers/anthropic.png",
  mistral: "/images/providers/mistral.png",
};

// Default image if provider doesn't have a specific one
const defaultProviderImage = "/images/providers/openai.png";

export default function VoiceProvidersTab() {
  const navigate = useNavigate();

  // Fetch speech providers
  const { data: providersData, isLoading } = useQuery({
    queryKey: ["providers", "speech"],
    queryFn: () => getProvidersByType("speech"),
  });

  // Navigate to add new provider form
  const handleAddProvider = () => {
    navigate("/settings/provider/new/speech");
  };

  // Navigate to edit provider form
  const handleEditProvider = (provider: Provider) => {
    navigate(`/settings/provider/edit/${provider.id}`);
  };

  // Format providers data for display
  const providers = providersData?.providers || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Voice Providers</h3>
        <Button onClick={handleAddProvider} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Voice Provider
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Configure voice service providers for text-to-speech and speech-to-text
        capabilities.
      </p>

      {isLoading ? (
        <div className="py-8 text-center">Loading voice providers...</div>
      ) : (
        <div className="flex flex-wrap gap-4 py-2 px-1 w-full pb-4">
          {providers.map((provider: Provider) => (
            <ProviderCard
              key={provider.id}
              name={provider.providerName}
              imageSrc={
                providerImages[provider.providerName.toLowerCase()] ||
                defaultProviderImage
              }
              onClick={() => handleEditProvider(provider)}
              className={provider.default ? "border-primary border-2" : ""}
            />
          ))}

          {/* Add Provider Card */}
          <ProviderCard
            name=""
            imageSrc=""
            onClick={handleAddProvider}
            className="border-dashed flex flex-col items-center justify-center"
          >
            <PlusCircle className="h-10 w-10 mb-2 text-gray-400" />
          </ProviderCard>
        </div>
      )}
    </div>
  );
}
