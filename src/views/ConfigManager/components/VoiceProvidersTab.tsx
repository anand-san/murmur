import ProviderCard from "./ProviderCard";

// Voice provider type
interface VoiceProvider {
  id: string;
  name: string;
  imageSrc: string;
}

// Sample voice providers
const voiceProviders: VoiceProvider[] = [
  {
    id: "openai-compatible",
    name: "OpenAI Compatible",
    imageSrc: "/images/providers/openai.png",
  },
];

export default function VoiceProvidersTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Voice Providers</h3>
      <p className="text-sm text-gray-500">
        Select a voice service provider to use for text-to-speech and
        speech-to-text capabilities.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {voiceProviders.map((provider) => (
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
