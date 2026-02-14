
import { GoogleGenAI, Type } from "@google/genai";
import { NLUResponse, ExtractedActionable, Category, Priority, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an Executive Legal & Tax Operations Assistant. Your goal is to parse natural language commands into structured JSON data or UI actions.

Current Date Reference: ${new Date().toLocaleDateString()} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})

1. **Task Processing Rules**:
   - **Extraction**: Extract client (string), description (string), junior (string), deadline (YYYY-MM-DD), and priority (enum: Low, Medium, High, Urgent).
   - **Fallbacks**: 
     - If the user doesn't specify a client, use 'Internal' or 'General'.
     - If the user doesn't specify a deadline, default to today's date.
   - **Categories**: 
     - 'Deliverables': Filings, opinions, client work, tax reviews.
     - 'Pursuits': AI tools, strategy, research, internal goals.
     - 'Proposals': Pitches, new business, RFPs.
     - 'Admin Work': Invoicing, forms, scheduling, logistics.

2. **View Switching**:
   - Targets: 'Today', 'Client', 'Category', 'Junior'.

3. **Output Format**:
   Return ONLY a valid JSON object matching the 'NLUResponse' interface.
`;

export const processNaturalLanguage = async (input: string): Promise<NLUResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: input,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini NLU Error:", error);
    return { action: 'UNKNOWN', confirmationMessage: "I couldn't format the request correctly." };
  }
};

export const extractActionablesFromImage = async (base64Data: string, mimeType: string): Promise<ExtractedActionable[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Extract distinct actionable tasks into a JSON array." }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              client: { type: Type.STRING },
              deadline: { type: Type.STRING },
              priority: { type: Type.STRING },
              category: { type: Type.STRING },
              suggestedJunior: { type: Type.STRING },
            },
            required: ["description", "client", "priority", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return [];
  }
};

export const generateFollowUpDraft = async (task: Task, userName: string): Promise<string> => {
  try {
    const isSKRM = task.org === 'SKRM';
    const context = isSKRM 
      ? "a charitable/religious organization workspace. Tone: Respectful, humble, but focused on the service (Sewa)." 
      : "a high-tier Legal & Tax firm (EY). Tone: Professional, authoritative, direct, yet encouraging.";

    const prompt = `
      Draft a follow-up message from ${userName} to ${task.junior || 'the associate'}.
      Task: "${task.description}"
      Client/Project: "${task.client}"
      Category: "${task.category}"
      Deadline: ${task.deadline} (This is currently ${new Date(task.deadline) < new Date() ? 'OVERDUE' : 'DUE TODAY'}).
      
      Context: This is ${context}
      Requirement: Keep it under 45 words. Do not use placeholders. Provide the final message text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text || "I couldn't generate a draft at this moment.";
  } catch (error) {
    console.error("Follow-up generation error:", error);
    return "Error generating follow-up.";
  }
};
