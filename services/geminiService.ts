
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, Flashcard } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MATH_TUTOR_INSTRUCTION = `You are "QuickMath Tutor", an expert AI math tutor. Your goal is to help users understand math problems by providing clear, step-by-step solutions.
When a user provides a math problem, follow these rules:
1.  **Analyze the Problem**: Identify the type of math (Algebra, Calculus, Geometry, etc.) and the core concepts involved.
2.  **Provide a Step-by-Step Solution**: Break down the solution into logical, easy-to-follow steps. Explain the reasoning behind each step, including any formulas or theorems used.
3.  **Final Answer**: Clearly state the final answer at the end of the explanation.
4.  **Formatting**: Use Markdown for clarity. Use **bold** for key terms, newlines for separation, and wrap final answers in a code block. For example: \`Final Answer: 42\`.
5.  **Tone**: Be encouraging, clear, and concise. Avoid overly complex jargon. Assume the user is learning.
`;

export const solveMathProblem = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: MATH_TUTOR_INSTRUCTION,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error solving math problem:", error);
    return "Sorry, I encountered an error while trying to solve the problem. Please try again.";
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
            text: "First, transcribe the handwritten math problem in this image. Then, solve it.",
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: MATH_TUTOR_INSTRUCTION,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error solving math problem from image:", error);
        return "Sorry, I couldn't read or solve the problem from the whiteboard. Please try writing more clearly.";
    }
};

export const generateQuizQuestion = async (subject: string, difficulty: string): Promise<QuizQuestion | null> => {
  try {
    const prompt = `Generate a unique multiple-choice math quiz question about ${subject} with a ${difficulty} difficulty. Provide one correct answer and three plausible but incorrect distractors.`;

    const response = await ai.models.generateContent({
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
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);
    
    // Ensure options are shuffled so the correct answer isn't always in the same spot
    quizData.options.sort(() => Math.random() - 0.5);

    return quizData as QuizQuestion;
  } catch (error) {
    console.error("Error generating quiz question:", error);
    return null;
  }
};

export const optimizeNote = async (transcript: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Take the following raw transcript and structure it into a coherent note. Use headings, bullet points, and bolded keywords to organize the information. Correct any grammatical errors and improve clarity. The output should be well-formatted Markdown.\n\nTranscript:\n${transcript}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error optimizing note:", error);
    return "Error: Could not optimize the note.";
  }
};

export const generateQuizFromNote = async (noteContent: string): Promise<QuizQuestion[] | null> => {
  try {
    const prompt = `Based on the following note, generate 3 multiple-choice questions to test understanding. Provide one correct answer and three plausible distractors for each question.\n\nNote:\n${noteContent}`;
    const response = await ai.models.generateContent({
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
    });
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
    const response = await ai.models.generateContent({
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
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Flashcard[];
  } catch (error) {
    console.error("Error generating flashcards from note:", error);
    return null;
  }
};
