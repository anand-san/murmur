import ProviderCard from "./ProviderCard";

// Chat provider type
interface ChatProvider {
  id: string;
  name: string;
  imageSrc: string;
}

const chatProviders: ChatProvider[] = [
  {
    id: "ollama",
    name: "Ollama",
    imageSrc: "/images/providers/ollama.png", // Using mistral as temporary logo for Ollama
  },
  {
    id: "openai-compatible",
    name: "OpenAI Compatible",
    imageSrc: "/images/providers/openai.png",
  },
];

export default function ChatProvidersTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Chat Models</h3>
      <p className="text-sm text-gray-500">
        Select a provider for AI chat functionality. This determines which
        language models will be available.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chatProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            name={provider.name}
            imageSrc={provider.imageSrc}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
