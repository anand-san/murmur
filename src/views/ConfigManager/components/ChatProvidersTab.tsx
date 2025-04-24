import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProviderCard from "./ProviderCard";
import { Provider } from "../../../api/config/providers";
import { Button } from "../../../components/ui/button";
import { getProvidersByType } from "../../../api/config/providers";

// Map of provider IDs to their image paths
const providerImages: Record<string, string> = {
  ollama: "/images/providers/ollama.png",
  openai: "/images/providers/openai.png",
  anthropic: "/images/providers/anthropic.png",
  google: "/images/providers/google.png",
  mistral: "/images/providers/mistral.png",
  groq: "/images/providers/groq.png",
};

// Default image if provider doesn't have a specific one
const defaultProviderImage = "/images/providers/openai.png";

export default function ChatProvidersTab() {
  const navigate = useNavigate();

  // Fetch chat providers
  const { data: providersData, isLoading } = useQuery({
    queryKey: ["providers", "chat"],
    queryFn: () => getProvidersByType("chat"),
  });

  // Navigate to add new provider form
  const handleAddProvider = () => {
    navigate("/settings/provider/new/chat");
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
        <h3 className="text-lg font-medium">Chat Models</h3>
        <Button onClick={handleAddProvider} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Configure providers for AI chat functionality. You can add new providers
        or edit existing ones.
      </p>

      {isLoading ? (
        <div className="py-8 text-center">Loading providers...</div>
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
            >
              <div className="text-xs text-gray-500 mt-1">
                {provider.nickName}
              </div>
            </ProviderCard>
          ))}

          {/* Add Provider Card */}
          <ProviderCard
            name=""
            imageSrc=""
            onClick={handleAddProvider}
            className="border-dashed flex flex-col items-center justify-center min-w-[140px]"
          >
            <PlusCircle className="h-10 w-10 mb-2 text-gray-400" />
          </ProviderCard>
        </div>
      )}
    </div>
  );
}
