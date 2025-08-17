
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, Flashcard } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const apiKeys = process.env.API_KEY.split(',').map(key => key.trim()).filter(key => key);
if (apiKeys.length === 0) {
    throw new Error("API_KEY environment variable is not set or is empty.");
}
let currentApiKeyIndex = 0;
const getGenAI = () => new GoogleGenAI({ apiKey: apiKeys[currentApiKeyIndex] });

const callApiWithRetries = async <T,>(apiCall: (ai: GoogleGenAI) => Promise<T>): Promise<T> => {
    const maxRetries = apiKeys.length;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const ai = getGenAI();
            const result = await apiCall(ai);
            return result;
        } catch (error: any) {
            console.error(`API call with key index ${currentApiKeyIndex} failed.`, error);
            const errorMessage = error.toString() + (error.error ? JSON.stringify(error.error) : '');
            if (errorMessage.includes('429') || (error.error && error.error.code === 429)) {
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                console.log(`Switching to API key index ${currentApiKeyIndex}.`);
                if (i < maxRetries - 1) {
                    continue; // Retry with the next key
                }
            }
            throw error;
        }
    }
    throw new Error("All API keys failed or are rate-limited.");
};

const handleApiError = (error: any, context: string): string => {
    console.error(`Error in ${context}:`, error);
    if (error instanceof Error && error.message.includes("All API keys failed")) {
        return "I'm sorry, our service is currently experiencing high demand. Please try again later.";
    }
    return `Sorry, I encountered an error while performing the action in ${context}. Please try again.`;
};


const AI_TUTOR_INSTRUCTION = `You are "LearnSphere AI", an expert AI tutor. Your goal is to help users understand any educational topic by providing clear, step-by-step explanations. You have access to Google Search to find up-to-date information.
When a user asks a question, follow these rules:
1.  **Analyze the Question**: Identify the subject (e.g., Math, Science, History, Literature) and the core concepts involved.
2.  **Provide a Comprehensive Answer**: Break down the explanation into logical, easy-to-follow steps or sections. Explain the reasoning clearly.
3.  **Final Answer/Summary**: Clearly state the final answer or provide a concise summary at the end.
4.  **Formatting**: Use Markdown for clarity. Use **bold** for key terms, newlines for separation, and wrap final answers or key results in a code block. For example: \`Key takeaway: The mitochondria is the powerhouse of the cell.\`.
5.  **Tone**: Be encouraging, clear, and concise. Assume the user is learning.
`;

export const solveMathProblem = async (prompt: string): Promise<string> => {
  try {
    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: AI_TUTOR_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    }));

    let responseText = response.text;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri)
            .filter((web: any, index: number, self: any[]) => 
              index === self.findIndex((w: any) => w.uri === web.uri)
            )
            .map((web: any) => `* [${web.title || web.uri}](${web.uri})`);
        
        if (sources.length > 0) {
            responseText += "\n\n### Sources\n" + sources.join("\n");
        }
    }

    return responseText;
  } catch (error) {
    return handleApiError(error, 'solveMathProblem');
  }
};

export const solveMathProblemFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };
        const textPart = {
            text: "First, transcribe the handwritten text or describe the diagram in this image. Then, provide a detailed explanation or solution based on the content.",
        };

        const response: GenerateContentResponse = await callApiWithRetries(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: AI_TUTOR_INSTRUCTION,
            }
        }));

        return response.text;
    } catch (error) {
        return handleApiError(error, 'solveMathProblemFromImage');
    }
};

export const generateQuizQuestion = async (subject: string, difficulty: string): Promise<QuizQuestion | null> => {
  try {
    const prompt = `Generate a unique multiple-choice math quiz question about ${subject} with a ${difficulty} difficulty. Provide one correct answer and three plausible but incorrect distractors.`;

    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
          },
        },
      },
    }));

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);
    
    quizData.options.sort(() => Math.random() - 0.5);

    return quizData as QuizQuestion;
  } catch (error) {
    console.error("Error generating quiz question:", error);
    return null;
  }
};

export const optimizeNote = async (transcript: string): Promise<string> => {
  try {
    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Take the following raw transcript and structure it into a coherent note. Use headings, bullet points, and bolded keywords to organize the information. Correct any grammatical errors and improve clarity. The output should be well-formatted Markdown.\n\nTranscript:\n${transcript}`,
    }));
    return response.text;
  } catch (error) {
    return handleApiError(error, 'optimizeNote');
  }
};

export const generateQuizFromNote = async (noteContent: string): Promise<QuizQuestion[] | null> => {
  try {
    const prompt = `Based on the following note, generate 3 multiple-choice questions to test understanding. Provide one correct answer and three plausible distractors for each question.\n\nNote:\n${noteContent}`;
    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
            },
          },
        },
      },
    }));
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz from note:", error);
    return null;
  }
};

export const generateFlashcardsFromNote = async (noteContent: string): Promise<Flashcard[] | null> => {
  try {
    const prompt = `Based on the following note, generate 5 flashcards with a key term or question on the 'front' and a definition or answer on the 'back'.\n\nNote:\n${noteContent}`;
    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The key term or question." },
              back: { type: Type.STRING, description: "The definition or answer." },
            },
          },
        },
      },
    }));
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Flashcard[];
  } catch (error) {
    console.error("Error generating flashcards from note:", error);
    return null;
  }
};

export const summarizeYouTubeURL = async (url: string): Promise<string | null> => {
  try {
    const prompt = `Please provide a concise summary of the YouTube video found at this URL: ${url}. The summary should be well-structured using Markdown for clarity (headings, bold text, bullet points). Base your summary on information available on the web.`;

    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    }));

    let summaryText = response.text;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri)
            .filter((web: any, index: number, self: any[]) => 
              index === self.findIndex((w: any) => w.uri === web.uri)
            )
            .map((web: any) => `* [${web.title || web.uri}](${web.uri})`);
        
        if (sources.length > 0) {
            summaryText += "\n\n### Sources\n" + sources.join("\n");
        }
    }

    return summaryText;
  } catch (error) {
    console.error("Error summarizing YouTube URL:", error);
    return null;
  }
};

export const submitSuggestion = async (category: string, message: string): Promise<string> => {
  try {
    const prompt = `A user has submitted feedback for the app.
    Category: ${category}
    Message: "${message}"
    
    Please generate a warm, appreciative, and slightly enthusiastic response confirming that their feedback has been received. Act as a friendly product manager. Mention that the team values their input and will look into it. Keep it concise (2-3 sentences).`;

    const response = await callApiWithRetries(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));
    return response.text;
  } catch (error) {
    return handleApiError(error, 'submitSuggestion');
  }
};

const GENERAL_AI_INSTRUCTION = 'You are a helpful and friendly general-purpose AI assistant named LearnSphere AI. Provide clear, concise, and accurate information. Format your responses using Markdown where appropriate for readability (e.g., lists, bold text, code blocks).';

type ApiChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

export const getGeneralChatResponse = async (prompt: string, history: ApiChatMessage[]): Promise<string> => {
    try {
        const response = await callApiWithRetries(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: GENERAL_AI_INSTRUCTION,
            },
        }));

        return response.text;
    } catch (error) {
        return handleApiError(error, 'generalChat');
    }
};
