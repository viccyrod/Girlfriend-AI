'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPortal } from 'react-dom';

interface GuidedCreationFormProps {
  user: User;
  setParentLoading: (loading: boolean) => void;
}

type Step = {
  id: 'basic' | 'appearance' | 'personality' | 'background' | 'interests';
  title: string;
  description: string;
  illustration: string;
};

// Predefined options
const BODY_TYPES = [
  { id: 'slim', label: 'Slim', icon: '👗' },
  { id: 'athletic', label: 'Athletic', icon: '💪' },
  { id: 'curvy', label: 'Curvy', icon: '🎀' },
  { id: 'petite', label: 'Petite', icon: '✨' },
];

const HAIR_COLORS = [
  { id: 'blonde', label: 'Blonde', color: '#FFD700' },
  { id: 'brown', label: 'Brown', color: '#8B4513' },
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'red', label: 'Red', color: '#FF4500' },
  { id: 'pink', label: 'Pink', color: '#FF69B4' },
  { id: 'purple', label: 'Purple', color: '#800080' },
];

const HAIR_STYLES = [
  { id: 'straight', label: 'Straight', icon: '⬇️' },
  { id: 'wavy', label: 'Wavy', icon: '〰️' },
  { id: 'curly', label: 'Curly', icon: '🌀' },
  { id: 'short', label: 'Short', icon: '✂️' },
];

const EYE_COLORS = [
  { id: 'blue', label: 'Blue', color: '#0000FF' },
  { id: 'green', label: 'Green', color: '#008000' },
  { id: 'brown', label: 'Brown', color: '#8B4513' },
  { id: 'hazel', label: 'Hazel', color: '#8E7618' },
  { id: 'purple', label: 'Purple', color: '#800080' },
];

const HEIGHTS = [
  { id: 'petite', label: 'Petite (4\'11" - 5\'3")', icon: '👧' },
  { id: 'average', label: 'Average (5\'4" - 5\'7")', icon: '👩' },
  { id: 'tall', label: 'Tall (5\'8" - 5\'11")', icon: '👱‍♀️' },
  { id: 'very-tall', label: 'Very Tall (6\'+)', icon: '🦒' },
];

const GENDERS = [
  { id: 'female', label: 'Female', icon: '👩' },
  { id: 'male', label: 'Male', icon: '👨' },
];

const STYLES = [
  { 
    id: 'realistic', 
    label: 'Realistic', 
    icon: '📸',
    description: 'Photorealistic appearance'
  },
  { 
    id: 'anime', 
    label: 'Anime', 
    icon: '✨',
    description: 'Anime/manga style'
  },
];

const PERSONALITY_TRAITS = [
  { id: 'sweet', label: 'Sweet & Caring', icon: '🥰', description: 'Gentle, nurturing, and empathetic' },
  { id: 'playful', label: 'Playful & Fun', icon: '😋', description: 'Energetic, humorous, and light-hearted' },
  { id: 'seductive', label: 'Seductive', icon: '💋', description: 'Alluring and sensual' },
  { id: 'dominant', label: 'Dominant', icon: '👑', description: 'Confident and assertive' },
  { id: 'submissive', label: 'Submissive', icon: '🎀', description: 'Eager to please and follow' },
  { id: 'bratty', label: 'Bratty', icon: '😈', description: 'Playfully mischievous and teasing' },
];

const COMMUNICATION_STYLES = [
  { id: 'flirty', label: 'Flirty', icon: '😘', description: 'Playful and romantic' },
  { id: 'direct', label: 'Direct', icon: '💯', description: 'Clear and straightforward' },
  { id: 'sweet', label: 'Sweet', icon: '🍯', description: 'Gentle and caring' },
  { id: 'teasing', label: 'Teasing', icon: '😏', description: 'Playful and mischievous' },
  { id: 'passionate', label: 'Passionate', icon: '🔥', description: 'Intense and enthusiastic' },
  { id: 'sultry', label: 'Sultry', icon: '✨', description: 'Seductively charming' },
];

const EMOTIONAL_RANGES = [
  { id: 'expressive', label: 'Very Expressive', icon: '🎭', description: 'Shows emotions openly' },
  { id: 'balanced', label: 'Balanced', icon: '⚖️', description: 'Moderate emotional display' },
  { id: 'intense', label: 'Intense', icon: '🌋', description: 'Deep emotional responses' },
  { id: 'playful', label: 'Playfully Wild', icon: '🎪', description: 'Energetic and uninhibited' },
];

const OCCUPATIONS = [
  { id: 'student', label: 'Student', icon: '📚', description: 'Currently studying' },
  { id: 'professional', label: 'Professional', icon: '💼', description: 'Career-focused' },
  { id: 'creative', label: 'Creative', icon: '🎨', description: 'Artist or creator' },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: '🚀', description: 'Business-minded' },
];

const HOBBIES_CATEGORIES = [
  { id: 'active', label: 'Active & Sports', icon: '🏃‍♀️', options: ['Yoga', 'Dancing', 'Hiking', 'Swimming'] },
  { id: 'creative', label: 'Creative Arts', icon: '🎨', options: ['Painting', 'Music', 'Writing', 'Photography'] },
  { id: 'intellectual', label: 'Intellectual', icon: '🧠', options: ['Reading', 'Chess', 'Learning Languages', 'Philosophy'] },
  { id: 'social', label: 'Social', icon: '🎉', options: ['Cooking', 'Travel', 'Movies', 'Gaming'] },
];

const CREATION_STEPS: Step[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Let&apos;s start with the essentials',
    illustration: '/illustrations/personality.svg'
  },
  {
    id: 'appearance',
    title: 'Physical Appearance',
    description: 'Let&apos;s design how your companion looks',
    illustration: '/illustrations/appearance.svg'
  },
  {
    id: 'personality',
    title: 'Personality Traits',
    description: 'Define their character and behavior',
    illustration: '/illustrations/personality.svg'
  },
  {
    id: 'background',
    title: 'Background Story',
    description: 'Create their history and memories',
    illustration: '/illustrations/background.svg'
  },
  {
    id: 'interests',
    title: 'Interests & Preferences',
    description: 'What makes them unique?',
    illustration: '/illustrations/interests.svg'
  }
];

const creationPhrases = [
  "Initializing quantum personality matrix... 🧬",
  "Generating ultra-high definition images using GPU clusters... 🖼️",
  "Synthesizing emotional response patterns... 💝",
  "Calibrating conversation dynamics... 💭",
  "Infusing with unique character traits... ✨",
  "Optimizing neural pathways... 🧠",
  "Adding sprinkles of charm and wit... ⭐",
  "Performing final personality alignment... 🎯",
  "Almost there, adding finishing touches... ✨",
  "Just a moment more, perfecting the details... 💫"
];

const CreationAnimation = ({ attempt }: { attempt: number }) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % creationPhrases.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return createPortal(
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-md z-[9999] flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Pulsing Heart Animation */}
          <div className="relative w-32 h-32 animate-pulse">
            <svg
              className="w-full h-full text-pink-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {/* Ripple Effect */}
            <div className="absolute inset-0 animate-ping">
              <svg
                className="w-full h-full text-pink-500 opacity-75"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Creating Your AI Companion
            </h3>
            <p className="text-lg text-muted-foreground animate-fade-in">
              {creationPhrases[currentPhrase]}
            </p>
            {attempt > 10 && (
              <p className="text-sm text-muted-foreground">
                This is taking longer than usual, but we&apos;re still working on it...
              </p>
            )}
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                style={{ 
                  width: `${((currentPhrase + 1) / creationPhrases.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Add type for the form data
interface FormData {
  name: string;
  gender: string;
  style: string;
  bodyType: string;
  height: string;
  skinColor: string;
  ethnicity: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  personality: string;
  communication: string;
  temperament: string;
  backstory: string;
  occupation: string;
  education: string;
  hobbies: string[];
  likes: string;
  dislikes: string;
  isPrivate: boolean;
}

const SKIN_TONES = [
  { id: 'fair', label: 'Fair', color: '#FFE5D6' },
  { id: 'light', label: 'Light', color: '#FFD5B8' },
  { id: 'medium', label: 'Medium', color: '#E8B89D' },
  { id: 'olive', label: 'Olive', color: '#C69076' },
  { id: 'tan', label: 'Tan', color: '#A67358' },
  { id: 'dark', label: 'Dark', color: '#6B4423' }
];

const ETHNICITIES = [
  { id: 'caucasian', label: 'Caucasian' },
  { id: 'asian', label: 'Asian' },
  { id: 'african', label: 'African' },
  { id: 'hispanic', label: 'Hispanic' },
  { id: 'middle-eastern', label: 'Middle Eastern' },
  { id: 'mixed', label: 'Mixed' }
];

export function GuidedCreationForm({ user, setParentLoading }: GuidedCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "",
    style: "",
    bodyType: "",
    height: "",
    skinColor: "",
    ethnicity: "",
    hairColor: "",
    hairStyle: "",
    eyeColor: "",
    personality: "",
    communication: "",
    temperament: "",
    backstory: "",
    occupation: "",
    education: "",
    hobbies: [],
    likes: "",
    dislikes: "",
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    setParentLoading(isSubmitting);
  }, [isSubmitting, setParentLoading]);

  const handleNext = () => {
    if (currentStep < CREATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < CREATION_STEPS.length - 1) {
      handleNext();
      return;
    }

    if (!formData.name || !formData.gender || !formData.style) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setPollAttempt(0);

    try {
      // Format the appearance string in a cleaner way
      const appearanceStr = [
        `Ethnicity: ${formData.ethnicity}`,
        `Skin: ${formData.skinColor}`,
        `Body Type: ${formData.bodyType}`,
        `Height: ${formData.height}`,
        `Hair: ${formData.hairColor} ${formData.hairStyle}`,
        `Eyes: ${formData.eyeColor}`
      ].filter(str => !str.includes('undefined')).join(' • ');

      // Format personality traits
      const personalityStr = formData.personality + '\n' +
        (formData.communication ? `Communication Style: ${formData.communication}\n` : '') +
        (formData.temperament ? `Emotional Range: ${formData.temperament}` : '');

      const grokPrompt = `Create a detailed profile for an AI companion with these characteristics:
Name: ${formData.name}
Gender: ${formData.gender}
Appearance: ${appearanceStr}
Core Personality: ${personalityStr}
Occupation: ${formData.occupation || 'Not specified'}
Education: ${formData.education || 'Not specified'}
Hobbies: ${formData.hobbies.join(', ')}
Likes: ${formData.likes || 'Not specified'}
Dislikes: ${formData.dislikes || 'Not specified'}

Please expand on these details and create a rich, engaging character profile.`;

      const grokResponse = await fetch('/api/ai-models/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: grokPrompt,
          isPrivate: formData.isPrivate
        })
      });

      if (!grokResponse.ok) {
        throw new Error('Failed to generate detailed profile');
      }

      const { id } = await grokResponse.json();
      
      const checkModelStatus = async () => {
        if (pollAttempt >= 30) { // 2 minutes max
          throw new Error('Model generation is taking longer than expected. Please check your profile page to see if it completed.');
        }

        try {
          const statusResponse = await fetch(`/api/ai-models/${id}/status`);
          if (!statusResponse.ok) {
            throw new Error('Failed to check model status');
          }

          const { status } = await statusResponse.json();
          
          if (status === 'COMPLETED') {
            router.push(`/community/AIModelProfile/${id}`);
          } else if (status === 'FAILED') {
            throw new Error('Model generation failed');
          } else {
            setPollAttempt(prev => prev + 1);
            // Increase polling interval as time goes on
            const delay = Math.min(2000 + (pollAttempt * 500), 10000); // Start at 2s, max 10s
            setTimeout(checkModelStatus, delay);
          }
        } catch (error) {
          throw error;
        }
      };

      await checkModelStatus();
    } catch (error) {
      console.error('Creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create AI model. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  const SelectionButton = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all duration-200 ${
        selected 
          ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]' 
          : 'border-primary/10 hover:border-primary/20 hover:bg-primary/5'
      }`}
    >
      {children}
    </button>
  );

  const ColorButton = ({ 
    color, 
    label, 
    selected, 
    onClick 
  }: { 
    color: string; 
    label: string; 
    selected: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
        selected ? 'scale-[1.05] shadow-lg' : ''
      }`}
    >
      <div 
        className={`w-8 h-8 rounded-full border-2 ${
          selected ? 'border-primary' : 'border-primary/20'
        }`}
        style={{ backgroundColor: color }}
      />
      <span className="text-sm">{label}</span>
    </button>
  );

  const renderAppearanceFields = () => (
    <div className="space-y-8">
      {/* Body Type */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Body Type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BODY_TYPES.map((type) => (
            <SelectionButton
              key={type.id}
              selected={formData.bodyType === type.id}
              onClick={() => setFormData({ ...formData, bodyType: type.id })}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{type.icon}</span>
                <span className="font-medium">{type.label}</span>
              </div>
            </SelectionButton>
          ))}
        </div>
      </div>

      {/* Ethnicity */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Ethnicity</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ETHNICITIES.map((ethnicity) => (
            <SelectionButton
              key={ethnicity.id}
              selected={formData.ethnicity === ethnicity.id}
              onClick={() => setFormData({ ...formData, ethnicity: ethnicity.id })}
            >
              <span className="font-medium">{ethnicity.label}</span>
            </SelectionButton>
          ))}
        </div>
      </div>

      {/* Skin Tone */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Skin Tone</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SKIN_TONES.map((tone) => (
            <SelectionButton
              key={tone.id}
              selected={formData.skinColor === tone.id}
              onClick={() => setFormData({ ...formData, skinColor: tone.id })}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: tone.color }} 
                />
                <span className="font-medium">{tone.label}</span>
              </div>
            </SelectionButton>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Height</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {HEIGHTS.map((height) => (
            <SelectionButton
              key={height.id}
              selected={formData.height === height.id}
              onClick={() => setFormData({ ...formData, height: height.id })}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{height.icon}</span>
                <span className="text-sm text-center">{height.label}</span>
              </div>
            </SelectionButton>
          ))}
        </div>
      </div>

      {/* Hair */}
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-lg font-medium">Hair Color</Label>
          <div className="flex flex-wrap gap-4 justify-center">
            {HAIR_COLORS.map((color) => (
              <ColorButton
                key={color.id}
                color={color.color}
                label={color.label}
                selected={formData.hairColor === color.id}
                onClick={() => setFormData({ ...formData, hairColor: color.id })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-medium">Hair Style</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HAIR_STYLES.map((style) => (
              <SelectionButton
                key={style.id}
                selected={formData.hairStyle === style.id}
                onClick={() => setFormData({ ...formData, hairStyle: style.id })}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{style.icon}</span>
                  <span className="font-medium">{style.label}</span>
                </div>
              </SelectionButton>
            ))}
          </div>
        </div>
      </div>

      {/* Eye Color */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Eye Color</Label>
        <div className="flex flex-wrap gap-4 justify-center">
          {EYE_COLORS.map((color) => (
            <ColorButton
              key={color.id}
              color={color.color}
              label={color.label}
              selected={formData.eyeColor === color.id}
              onClick={() => setFormData({ ...formData, eyeColor: color.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = (step: Step) => {
    switch (step.id) {
      case 'basic':
        return (
          <div className="space-y-8">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-medium">What&apos;s their name?</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 text-lg rounded-xl bg-background/50 border-primary/10"
                placeholder="Enter their name..."
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Gender</Label>
              <div className="grid grid-cols-2 gap-4">
                {GENDERS.map((gender) => (
                  <SelectionButton
                    key={gender.id}
                    selected={formData.gender === gender.id}
                    onClick={() => setFormData({ ...formData, gender: gender.id })}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">{gender.icon}</span>
                      <span className="text-lg font-medium">{gender.label}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Visual Style</Label>
              <div className="grid grid-cols-2 gap-4">
                {STYLES.map((style) => (
                  <SelectionButton
                    key={style.id}
                    selected={formData.style === style.id}
                    onClick={() => setFormData({ ...formData, style: style.id })}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">{style.icon}</span>
                      <span className="text-lg font-medium">{style.label}</span>
                      <span className="text-sm text-muted-foreground">{style.description}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return renderAppearanceFields();
      case 'personality':
        return (
          <div className="space-y-8">
            {/* Core Personality */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Core Personality</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PERSONALITY_TRAITS.map((trait) => (
                  <SelectionButton
                    key={trait.id}
                    selected={formData.personality === trait.id}
                    onClick={() => setFormData({ ...formData, personality: trait.id })}
                  >
                    <div className="flex flex-col items-center gap-2 p-3">
                      <span className="text-4xl">{trait.icon}</span>
                      <span className="text-lg font-medium">{trait.label}</span>
                      <span className="text-sm text-muted-foreground text-center">{trait.description}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>

            {/* Communication Style */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Communication Style</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {COMMUNICATION_STYLES.map((style) => (
                  <SelectionButton
                    key={style.id}
                    selected={formData.communication === style.id}
                    onClick={() => setFormData({ ...formData, communication: style.id })}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{style.icon}</span>
                      <span className="font-medium">{style.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{style.description}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>

            {/* Emotional Range */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Emotional Range</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {EMOTIONAL_RANGES.map((range) => (
                  <SelectionButton
                    key={range.id}
                    selected={formData.temperament === range.id}
                    onClick={() => setFormData({ ...formData, temperament: range.id })}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{range.icon}</span>
                      <span className="font-medium">{range.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{range.description}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>
          </div>
        );
      case 'background':
        return (
          <div className="space-y-8">
            {/* Occupation */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Current Occupation</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {OCCUPATIONS.map((occupation) => (
                  <SelectionButton
                    key={occupation.id}
                    selected={formData.occupation === occupation.id}
                    onClick={() => setFormData({ ...formData, occupation: occupation.id })}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{occupation.icon}</span>
                      <span className="font-medium">{occupation.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{occupation.description}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>

            {/* Life Story */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Life Story</Label>
              <Textarea
                value={formData.backstory}
                onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                className="min-h-[150px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 resize-none"
                placeholder="Share their background story, key life events, and what shaped them into who they are..."
              />
            </div>

            {/* Education/Experience */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Education & Experience</Label>
              <Textarea
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="min-h-[100px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 resize-none"
                placeholder="Describe their educational background and life experiences..."
              />
            </div>
          </div>
        );
      case 'interests':
        return (
          <div className="space-y-8">
            {/* Hobbies & Activities */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Hobbies & Activities</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {HOBBIES_CATEGORIES.map((category) => (
                  <SelectionButton
                    key={category.id}
                    selected={formData.hobbies.includes(category.id)}
                    onClick={() => {
                      const updatedHobbies = formData.hobbies.includes(category.id)
                        ? formData.hobbies.filter(h => h !== category.id)
                        : [...formData.hobbies, category.id];
                      setFormData({ ...formData, hobbies: updatedHobbies });
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 p-4">
                      <span className="text-4xl">{category.icon}</span>
                      <span className="text-lg font-medium">{category.label}</span>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {category.options.map((option) => (
                          <span key={option} className="text-sm px-2 py-1 rounded-full bg-primary/10">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  </SelectionButton>
                ))}
              </div>
            </div>

            {/* Likes */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Things They Love</Label>
              <Textarea
                value={formData.likes}
                onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
                className="min-h-[100px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 resize-none"
                placeholder="What brings them joy? What are they passionate about?"
              />
            </div>

            {/* Dislikes */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Things They Dislike</Label>
              <Textarea
                value={formData.dislikes}
                onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
                className="min-h-[100px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 resize-none"
                placeholder="What bothers them? What do they try to avoid?"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {isSubmitting && <CreationAnimation attempt={pollAttempt} />}
      <form onSubmit={handleSubmit} className="space-y-8 pb-10">
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / CREATION_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="pt-8 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Step header */}
                <div className="flex items-start md:items-center gap-6 md:gap-8">
                  <div className="flex-1 space-y-1">
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 leading-tight">
                      {CREATION_STEPS[currentStep].title}
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                      {CREATION_STEPS[currentStep].description}
                    </p>
                  </div>
                  <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
                    <Image
                      src={CREATION_STEPS[currentStep].illustration}
                      alt={CREATION_STEPS[currentStep].title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Step content */}
                <div className="bg-background/40 backdrop-blur-sm p-6 rounded-2xl border border-primary/10">
                  {renderStepContent(CREATION_STEPS[currentStep])}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex gap-2">
                {CREATION_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                        : 'bg-primary/20'
                    }`}
                  />
                ))}
              </div>

              {currentStep === CREATION_STEPS.length - 1 ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  {isSubmitting ? (
                    <>Creating...</>
                  ) : (
                    <>
                      Create Companion
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} className="gap-2">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
} 