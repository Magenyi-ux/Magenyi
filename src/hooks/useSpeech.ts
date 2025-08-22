
import { useState, useEffect, useCallback } from 'react';

// A mapping of desired voice names to a list of potential browser voice names.
// This allows for graceful fallbacks if a specific voice isn't available.
const VOICE_MAP: Record<string, string[]> = {
  'Sol': ['Google US English', 'Alex', 'Daniel'],
  'Mark': ['Microsoft David - English (United States)', 'Fred', 'Tom'],
};

export interface MappedVoice {
  name: 'Sol' | 'Mark';
  voice: SpeechSynthesisVoice;
}

// Helper function to clean text from markdown for better speech synthesis
const cleanTextForSpeech = (text: string): string => {
  return text
    // Handle markdown links, keeping only the link text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold/italics markers but keep content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove code backticks
    .replace(/`/g, '')
    // Remove horizontal rules
    .replace(/^-{3,}\s*$/gm, '')
    // Remove blockquotes
    .replace(/^>\s*/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove image tags but keep alt text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // The user's specific request
    .replace(/asterisks|asterritkers/gi, '');
};


// A custom hook to manage speech synthesis functionality
export const useSpeech = () => {
  const [availableVoices, setAvailableVoices] = useState<MappedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Finds and maps the available system voices to our desired names ('Sol', 'Mark').
  const getMappedVoices = useCallback(() => {
    if (!window.speechSynthesis) return;

    const allVoices = window.speechSynthesis.getVoices();
    if (allVoices.length === 0) return;

    const foundVoices: MappedVoice[] = [];

    // Try to find the preferred voices from our map
    for (const key in VOICE_MAP) {
      const voiceName = key as 'Sol' | 'Mark';
      const voice = allVoices.find(v => v.lang.startsWith('en') && VOICE_MAP[key].includes(v.name));
      if (voice && !foundVoices.some(fv => fv.voice.voiceURI === voice.voiceURI)) {
        foundVoices.push({ name: voiceName, voice });
      }
    }
    
    // As a fallback, if we couldn't find our preferred voices, grab the first two available US English voices.
    if (foundVoices.length < 2) {
        const englishVoices = allVoices.filter(v => v.lang === 'en-US' && !foundVoices.some(fv => fv.voice.voiceURI === v.voiceURI));
        if (!foundVoices.some(v => v.name === 'Sol') && englishVoices.length > 0) {
            foundVoices.push({ name: 'Sol', voice: englishVoices[0] });
        }
        if (!foundVoices.some(v => v.name === 'Mark') && englishVoices.length > 1) {
            foundVoices.push({ name: 'Mark', voice: englishVoices[1] });
        }
    }

    setAvailableVoices(foundVoices);
  }, []);

  // Effect to load voices and set the selected voice from localStorage on initial load.
  useEffect(() => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported.");
      return;
    }

    const loadVoices = () => {
      getMappedVoices();
      const savedVoiceURI = localStorage.getItem('selectedVoiceURI');
      if (savedVoiceURI) {
        const allVoices = window.speechSynthesis.getVoices();
        const voice = allVoices.find(v => v.voiceURI === savedVoiceURI);
        if (voice) {
          setSelectedVoice(voice);
        }
      }
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    }
  }, [getMappedVoices]);

  // Saves the user's voice choice to localStorage.
  const saveSelectedVoice = (voice: SpeechSynthesisVoice) => {
    localStorage.setItem('selectedVoiceURI', voice.voiceURI);
    setSelectedVoice(voice);
  };
  
  // Gets the friendly name ('Sol' or 'Mark') of the currently selected voice.
  const getSelectedVoiceName = (): 'Sol' | 'Mark' | null => {
      if (!selectedVoice) {
          // If no voice is selected yet, but voices are available, default to the first one
          if (availableVoices.length > 0) {
              return availableVoices[0].name;
          }
          return null;
      };
      const mapped = availableVoices.find(v => v.voice.voiceURI === selectedVoice.voiceURI);
      return mapped ? mapped.name : null;
  }

  // The main function to speak text. It uses the selected voice or falls back to default.
  const speak = useCallback((text: string, voice?: SpeechSynthesisVoice): SpeechSynthesisUtterance | null => {
    if (!window.speechSynthesis) return null;
    
    window.speechSynthesis.cancel(); // Stop any currently speaking utterance
    
    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Use the explicitly provided voice, the user's selected voice, or the first available mapped voice as a fallback.
    const voiceToUse = voice || selectedVoice || (availableVoices.length > 0 ? availableVoices[0].voice : null);
    utterance.voice = voiceToUse;
    
    window.speechSynthesis.speak(utterance);
    
    return utterance;
  }, [selectedVoice, availableVoices]);

  return { availableVoices, saveSelectedVoice, speak, getSelectedVoiceName };
};