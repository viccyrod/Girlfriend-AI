import { PersonalityMode } from '@/types/conversation';

interface ModeSelectorProps {
  mode: PersonalityMode;
  onChange: (mode: PersonalityMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 p-2">
      <button
        className={`px-4 py-2 rounded ${mode === 'sensible' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => onChange('sensible')}
      >
        Sensible
      </button>
      <button
        className={`px-4 py-2 rounded ${mode === 'balanced' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
        onClick={() => onChange('balanced')}
      >
        Balanced
      </button>
      <button
        className={`px-4 py-2 rounded ${mode === 'crazy' ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}
        onClick={() => onChange('crazy')}
      >
        Crazy
      </button>
    </div>
  );
}
