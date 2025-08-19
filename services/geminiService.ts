
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
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
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
            .map((chunk: any) => chunk.web).filter((web: any) => web && web.uri)
            .filter((web: any, index: number, self: any[]) => index === self.findIndex((w: any) => w.uri === web.uri))
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

export const askQuestionAboutImage = async (base64Image: string, mimeType: string, question: string): Promise<string> => {
    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: question };

        const response: GenerateContentResponse = await callApiWithRetries(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { systemInstruction: AI_TUTOR_INSTRUCTION }
        }));

        return response.text;
    } catch (error) {
        return handleApiError(error, 'askQuestionAboutImage');
    }
};

export const generateQuizQuestion = async (subject: string, difficulty: string): Promise<QuizQuestion | null> => {
  try {
    const prompt = `Generate a unique multiple-choice math quiz question about ${subject} with a ${difficulty} difficulty. Provide one correct answer and three plausible but incorrect distractors.`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: "gemini-2.5-flash", contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
        }},
      },
    }));
    const quizData = JSON.parse(response.text.trim());
    quizData.options.sort(() => Math.random() - 0.5);
    return quizData as QuizQuestion;
  } catch (error) { console.error("Error generating quiz question:", error); return null; }
};

export const optimizeNote = async (transcript: string): Promise<string> => {
  try {
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Take the following raw transcript and structure it into a coherent note. Use headings, bullet points, and bolded keywords to organize the information. Correct any grammatical errors and improve clarity. The output should be well-formatted Markdown.\n\nTranscript:\n${transcript}`,
    }));
    return response.text;
  } catch (error) { return handleApiError(error, 'optimizeNote'); }
};

export const generateQuizFromNote = async (noteContent: string): Promise<QuizQuestion[] | null> => {
  try {
    const prompt = `Based on the following note, generate 3 multiple-choice questions to test understanding. Provide one correct answer and three plausible distractors for each question.\n\nNote:\n${noteContent}`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: "gemini-2.5-flash", contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
        }}},
      },
    }));
    return JSON.parse(response.text.trim()) as QuizQuestion[];
  } catch (error) { console.error("Error generating quiz from note:", error); return null; }
};

export const generateFlashcardsFromNote = async (noteContent: string): Promise<Flashcard[] | null> => {
  try {
    const prompt = `Based on the following note, generate 5 flashcards with a key term or question on the 'front' and a definition or answer on the 'back'.\n\nNote:\n${noteContent}`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: "gemini-2.5-flash", contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
              front: { type: Type.STRING, description: "The key term or question." },
              back: { type: Type.STRING, description: "The definition or answer." },
        }}},
      },
    }));
    return JSON.parse(response.text.trim()) as Flashcard[];
  } catch (error) { console.error("Error generating flashcards from note:", error); return null; }
};

export const summarizeYouTubeURL = async (url: string): Promise<string | null> => {
  try {
    const prompt = `Please provide a concise summary of the YouTube video found at this URL: ${url}. The summary should be well-structured using Markdown for clarity (headings, bold text, bullet points). Base your summary on information available on the web.`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] },
    }));
    let summaryText = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => chunk.web).filter((web: any) => web && web.uri)
            .filter((web: any, index: number, self: any[]) => index === self.findIndex((w: any) => w.uri === web.uri))
            .map((web: any) => `* [${web.title || web.uri}](${web.uri})`);
        if (sources.length > 0) summaryText += "\n\n### Sources\n" + sources.join("\n");
    }
    return summaryText;
  } catch (error) { console.error("Error summarizing YouTube URL:", error); return null; }
};

export const submitSuggestion = async (category: string, message: string): Promise<string> => {
  try {
    const prompt = `A user has submitted feedback for the app. Category: ${category}, Message: "${message}". Generate a warm, appreciative response confirming receipt. Act as a friendly product manager. Keep it concise (2-3 sentences).`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash', contents: prompt,
    }));
    return response.text;
  } catch (error) { return handleApiError(error, 'submitSuggestion'); }
};

export const generateExplanation = async (noteContent: string): Promise<{ script: string; imageUrl: string | null }> => {
    try {
        const generationPrompt = `Based on the following note, create two things:
1. A concise and clear "script" (around 100-150 words) that explains the main topic in a way that could be read aloud by a tutor.
2. A simple, descriptive "image_prompt" for an AI image generator to create a helpful visual aid (like a diagram, chart, or illustrative scene) for this topic.
Note: ${noteContent}`;
        const explanationResponse = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: "gemini-2.5-flash", contents: generationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: {
                    script: { type: Type.STRING, description: "The educational script to be read aloud." },
                    image_prompt: { type: Type.STRING, description: "A prompt for an image generator." },
                }},
            },
        }));
        const { script, image_prompt } = JSON.parse(explanationResponse.text.trim());
        if (!script || !image_prompt) throw new Error("Failed to generate script or image prompt.");

        try {
            const imageResponse = await callApiWithRetries(ai => ai.models.generateImages({
                model: 'imagen-3.0-generate-002', prompt: image_prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
            }));
            const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
            return { script, imageUrl: `data:image/jpeg;base64,${base64ImageBytes}` };
        } catch(imageError) {
            console.error("Image generation failed, returning script only.", imageError);
            return { script, imageUrl: null };
        }
    } catch (error) {
        console.error("Error in generateExplanation:", error);
        throw new Error("Failed to generate explanation. " + handleApiError(error, 'generateExplanation'));
    }
};

const AI_TUTOR_CHAT_INSTRUCTION = 'You are LearnSphere AI, a friendly and encouraging AI Tutor. Your goal is to have a natural, helpful conversation with the user. Help them with their questions, but keep your tone conversational and supportive. Use Markdown for readability.';
type ApiChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };
export const getAiTutorResponse = async (prompt: string, history: ApiChatMessage[]): Promise<string> => {
    try {
        const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: AI_TUTOR_CHAT_INSTRUCTION },
        }));
        return response.text;
    } catch (error) { return handleApiError(error, 'aiTutorChat'); }
};

export const gradeEssay = async (essay: string): Promise<string> => {
    try {
        const prompt = `Act as an expert writing instructor. Analyze the following essay and provide constructive feedback. Structure your feedback in Markdown with these sections:
### Overall Impression
A brief, encouraging summary.
### Strengths
- Point 1
- Point 2
### Areas for Improvement
- Point 1 (with suggestions)
- Point 2 (with suggestions)
### Suggested Grade
Provide a letter grade (e.g., A-, B+) with a short justification.

Essay:\n${essay}`;
        const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt
        }));
        return response.text;
    } catch (error) { return handleApiError(error, 'gradeEssay'); }
};

export const generateStudyPlan = async (goals: string): Promise<any | null> => {
    try {
        const prompt = `A student needs a study plan. Their goals are: "${goals}". Create a 7-day study plan based on these goals. For each day, provide a main focus and 2-3 specific, actionable tasks.`;
        const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                    day: { type: Type.STRING, description: "e.g., Day 1: Monday" },
                    focus: { type: Type.STRING, description: "The main topic for the day." },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific study tasks." },
                }}},
            },
        }));
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error generating study plan:", error); return null; }
};

export const generateAudioRecapScript = async (noteContent: string): Promise<string> => {
    try {
        const prompt = `Transform the following study note into a "podcast-style" audio script (400-600 words). Make it engaging, conversational, and easy to understand when listened to. Use clear explanations and summarize key points at the end.\n\nNote:\n${noteContent}`;
        const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt
        }));
        return response.text;
    } catch (error) { return handleApiError(error, 'generateAudioRecapScript'); }
};

export const generateExplainerVideo = async (noteContent: string, onProgress: (message: string) => void): Promise<string | null> => {
    try {
        onProgress("1/4: Crafting video concept...");
        const videoPromptGen = `Based on the following note, create a short, visually engaging prompt for a text-to-video AI. The prompt should describe a simple scene that illustrates the core concept of the note. For example: "A vibrant, animated diagram showing the process of photosynthesis."\n\nNote:\n${noteContent}`;
        const promptResponse = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: videoPromptGen }));
        const videoPrompt = promptResponse.text.trim();
        
        onProgress("2/4: Sending to video generator...");
        const ai = getGenAI();
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001', prompt: videoPrompt, config: { numberOfVideos: 1 }
        });

        onProgress("3/4: Rendering video... (this may take a minute)");
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error("Video generation completed but no link was found.");
        
        onProgress("4/4: Downloading video file...");
        const videoUrl = `${downloadLink}&key=${apiKeys[currentApiKeyIndex]}`;
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        return objectUrl;
    } catch (error) {
        console.error("Error in generateExplainerVideo:", error);
        throw new Error("Failed to generate video. " + handleApiError(error, 'generateExplainerVideo'));
    }
};