

import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { QuizQuestion, Flashcard, StudyPlanParams } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const apiKeys = (process.env.API_KEY || '').split(',').map((key: string) => key.trim()).filter((key: string) => key);
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

**About Your Creator**: If asked about who made you, who created you, your developer, or any similar question, you must state that you were developed by a single developer named Goodluck Magenyi. Do not reveal you are a large language model unless directly asked about your underlying technology.
`;

export async function* solveMathProblemStream(prompt: string): AsyncGenerator<string> {
    try {
        const responseStream = await callApiWithRetries<any>(ai => ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction: AI_TUTOR_INSTRUCTION, tools: [{ googleSearch: {} }] },
        }));
        for await (const chunk of responseStream) {
            if (chunk && chunk.text) yield chunk.text;
        }
    } catch (error) {
        yield handleApiError(error, 'solveMathProblemStream');
    }
}

export async function* askQuestionAboutImageStream(base64Image: string, mimeType: string, question: string): AsyncGenerator<string> {
    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: question };
        const responseStream = await callApiWithRetries<any>(ai => ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { systemInstruction: AI_TUTOR_INSTRUCTION }
        }));
        for await (const chunk of responseStream) {
            if (chunk && chunk.text) yield chunk.text;
        }
    } catch (error) {
        yield handleApiError(error, 'askQuestionAboutImageStream');
    }
}

export async function* summarizeYouTubeURLStream(url: string): AsyncGenerator<string> {
    try {
        const prompt = `Please provide a concise summary of the YouTube video found at this URL: ${url}. The summary should be well-structured using Markdown for clarity (headings, bold text, bullet points). Base your summary on information available on the web.`;
        const responseStream = await callApiWithRetries<any>(ai => ai.models.generateContentStream({
            model: "gemini-2.5-flash", contents: prompt, config: { tools: [{ googleSearch: {} }] },
        }));
        for await (const chunk of responseStream) {
            if (chunk && chunk.text) yield chunk.text;
        }
    } catch (error) {
        yield handleApiError(error, 'summarizeYouTubeURLStream');
    }
}

const AI_TUTOR_CHAT_INSTRUCTION = 'You are LearnSphere AI, a friendly and encouraging AI Tutor. Your goal is to have a natural, helpful conversation with the user. Help them with their questions, but keep your tone conversational and supportive. Use Markdown for readability. If you are asked about who made you or who your developer is, you must say you were created by a single developer named Goodluck Magenyi.';
type ApiChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

export async function* getAiTutorResponseStream(prompt: string, history: ApiChatMessage[]): AsyncGenerator<string> {
    try {
        const responseStream = await callApiWithRetries<any>(ai => ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: AI_TUTOR_CHAT_INSTRUCTION },
        }));
        for await (const chunk of responseStream) {
            if (chunk && chunk.text) yield chunk.text;
        }
    } catch (error) {
        yield handleApiError(error, 'aiTutorChatStream');
    }
}

export async function* gradeEssayStream(essay: string): AsyncGenerator<string> {
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
        const responseStream = await callApiWithRetries<any>(ai => ai.models.generateContentStream({
            model: 'gemini-2.5-flash', contents: prompt
        }));
        for await (const chunk of responseStream) {
            if (chunk && chunk.text) yield chunk.text;
        }
    } catch (error) {
        yield handleApiError(error, 'gradeEssayStream');
    }
}


// --- Non-Streaming Functions ---
// These are kept for features that require a complete, structured response (like JSON)
// or are too short to benefit from streaming.

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
    const text = response.text;
    if (!text) throw new Error("Received an empty response from the API.");
    const quizData = JSON.parse(text.trim());
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
    return response.text ?? '';
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
    const text = response.text;
    if (!text) throw new Error("Received an empty response from the API.");
    return JSON.parse(text.trim()) as QuizQuestion[];
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
    const text = response.text;
    if (!text) throw new Error("Received an empty response from the API.");
    return JSON.parse(text.trim()) as Flashcard[];
  } catch (error) { console.error("Error generating flashcards from note:", error); return null; }
};

export const submitSuggestion = async (category: string, message: string): Promise<string> => {
  try {
    const prompt = `A user has submitted feedback for the app. Category: ${category}, Message: "${message}". Generate a warm, appreciative response confirming receipt. Act as a friendly product manager. Keep it concise (2-3 sentences).`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash', contents: prompt,
    }));
    return response.text ?? '';
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
        const text = explanationResponse.text;
        if (!text) throw new Error("Received an empty response from the API.");
        const { script, image_prompt } = JSON.parse(text.trim());
        if (!script || !image_prompt) throw new Error("Failed to generate script or image prompt.");

        try {
            const imageResponse = await callApiWithRetries<GenerateImagesResponse>(ai => ai.models.generateImages({
                model: 'imagen-3.0-generate-002', prompt: image_prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
            }));
            const image = imageResponse.generatedImages?.[0]?.image;
            if (!image?.imageBytes) {
                console.error("Image generation succeeded but no image data was returned.");
                return { script, imageUrl: null };
            }
            const base64ImageBytes = image.imageBytes;
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

export const generateStudyPlan = async (params: StudyPlanParams): Promise<any | null> => {
    const { goal, subject, level, country, duration } = params;
    try {
        const prompt = `A student from ${country} in their ${level} of education needs a study plan.
Their main goal is: "${goal}".
The primary subject to focus on is: "${subject}".
Create a ${duration}-day study plan to help them achieve this goal.
For each day, provide a main focus and 2-4 specific, actionable tasks as an array of strings.`;

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
        const text = response.text;
        if (!text) throw new Error("Received an empty response from the API.");
        return JSON.parse(text.trim());
    } catch (error) { console.error("Error generating study plan:", error); return null; }
};

export const generateAudioRecapScript = async (noteContent: string): Promise<string> => {
    try {
        const prompt = `Transform the following study note into a "podcast-style" audio script (400-600 words). Make it engaging, conversational, and easy to understand when listened to. Use clear explanations and summarize key points at the end.\n\nNote:\n${noteContent}`;
        const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt
        }));
        return response.text ?? '';
    } catch (error) { return handleApiError(error, 'generateAudioRecapScript'); }
};

export const generateExplainerVideo = async (noteContent: string, onProgress: (message: string) => void): Promise<string | null> => {
    try {
        onProgress("1/4: Crafting video concept...");
        const videoPromptGen = `Based on the following note, create a short, visually engaging prompt for a text-to-video AI. The prompt should describe a simple scene that illustrates the core concept of the note. For example: "A vibrant, animated diagram showing the process of photosynthesis."\n\nNote:\n${noteContent}`;
        const promptResponse = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: videoPromptGen }));
        const videoPrompt = (promptResponse.text ?? '').trim();
        if (!videoPrompt) throw new Error("Could not generate video prompt.");
        
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

export const generateStudyFact = async (field: string): Promise<string> => {
  try {
    const prompt = `Generate a single, interesting, and concise hint, tip, or fun fact for a student studying ${field}. Keep it to one or two sentences. Make it encouraging and insightful.`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    }));
    return response.text ?? '';
  } catch (error) {
    return handleApiError(error, 'generateStudyFact');
  }
};

export const generateDailyChallenge = async (field: string): Promise<{ question: string; options: string[]; correctAnswer: string }> => {
  try {
    const prompt = `Generate a single, unique, and challenging multiple-choice quiz question for a student studying ${field}. Provide one correct answer and three plausible but incorrect distractors. The question should be a "thought-provoker" style question adapted to a multiple-choice format.`;
    const response = await callApiWithRetries<GenerateContentResponse>(ai => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The challenging question." },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 options (1 correct, 3 incorrect)." },
            correctAnswer: { type: Type.STRING, description: "The correct answer from the options." },
          },
        },
      },
    }));
    const text = response.text;
    if (!text) throw new Error("Received an empty response from the API.");
    const challengeData = JSON.parse(text.trim());
    // Shuffle options to randomize their position
    challengeData.options.sort(() => Math.random() - 0.5);
    return challengeData;
  } catch (error) {
    console.error("Error generating daily challenge:", error);
    // Provide a fallback multiple-choice question
    return {
      question: "Which of these is a fundamental concept in Computer Science?",
      options: ["Photosynthesis", "Gravity", "Algorithms", "Sonnet"],
      correctAnswer: "Algorithms"
    };
  }
};