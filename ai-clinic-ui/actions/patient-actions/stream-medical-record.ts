"use server";

import {
  medicalRecordAiSchema,
  type MedicalRecordAi,
} from "@/drizzle/general-medical-history";
import { GoogleGenAI } from "@google/genai";
import z from "zod";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type StreamMedicalRecordPayload = {
  fileName?: string;
  fileType?: string;
  fileData?: string;
  model?: string;
};

function parseBase64(data: string): string {
  return data.includes(",") ? data.split(",").pop() || "" : data;
}

export async function streamMedicalRecordFromPayload(
  payload: StreamMedicalRecordPayload,
): Promise<MedicalRecordAi> {
  const fileType = payload.fileType || "application/octet-stream";
  const model = payload.model ?? DEFAULT_MODEL;
  const fileData = payload.fileData;

  if (!fileData) {
    throw new Error("No file provided");
  }

  const base64Data = parseBase64(fileData);

  // Build the JSON schema description for the prompt (Gemini's responseSchema
  // rejects deeply-nested schemas, so we pass it as text instead).
  const jsonSchema = JSON.stringify(
    z.toJSONSchema(medicalRecordAiSchema),
    null,
    2,
  );

  const prompt = `Extract structured medical data from the attached document.
Return a JSON object that conforms EXACTLY to this JSON Schema:

${jsonSchema}

Rules:
- Use null for unknown or missing fields.
- Use arrays for list sections (allergies, conditions, medications, etc.).
- Use ISO 8601 date strings (e.g. "2024-03-15") for any date fields.
- Do NOT include id, patientId, createdAt, or updatedAt fields.
- Return ONLY the JSON object, no markdown fences or extra text.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: fileType,
          data: base64Data,
        },
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });
  console.log("Token usage", response.usageMetadata, "\n");
  const raw = response.text;
  if (!raw) {
    throw new Error("AI returned no output.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON.");
  }

  const validated = medicalRecordAiSchema.safeParse(parsed);
  if (!validated.success) {
    console.error("AI validation errors:", validated.error.format());
    throw new Error("AI output did not match the expected schema.");
  }

  return validated.data;
}
