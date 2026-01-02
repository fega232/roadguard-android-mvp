
import { GoogleGenAI, Type } from "@google/genai";
import { RoadSegment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSafetyInsights(segment: RoadSegment) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a brief, professional safety briefing for a driver approaching the following road segment in Nigeria: 
      Name: ${segment.name}
      Risk Level: ${segment.riskLevel}
      Common Causes: ${segment.commonCauses.join(', ')}
      Keep it actionable and local (Nigerian context). Max 3 sentences.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Drive with caution. Maintain safe distance and observe local FRSC speed limits.";
  }
}

export async function chatWithAssistant(history: {role: 'user'|'assistant', content: string}[]) {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are NaijaSafeDrive AI, an expert Nigerian road safety consultant. You provide advice based on FRSC (Federal Road Safety Corps) guidelines and local Nigerian driving conditions. Keep responses concise, helpful, and culturally relevant (Nigerian English is okay but keep it professional).",
    }
  });

  // Extract last message
  const lastMessage = history[history.length - 1].content;
  const result = await chat.sendMessage({ message: lastMessage });
  return result.text;
}
