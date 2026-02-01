import { GoogleGenAI, Type } from "@google/genai";
import { NotebookCell, Tone } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const convertScriptToNotebookCells = async (scriptContent: string, tone: Tone): Promise<NotebookCell[]> => {
  try {
    const SYSTEM_INSTRUCTION = `
You are an expert Data Science assistant and Technical Writer.
Your task is to convert raw Python scripts into structured Jupyter Notebooks.

Rules:
1. Analyze the provided Python code.
2. Break it into logical "cells".
3. Insert MARKDOWN cells before code blocks to explain the logic.
4. **TONE:** The documentation must be **${tone}**.
   - If 'Academic': Use formal language, cite concepts, use equations where applicable.
   - If 'Beginner-friendly': Simple language, step-by-step explanations, define terms.
   - If 'Enterprise': Focus on business value, scalability, and clean architecture.
5. **DEPENDENCIES:** If the code uses external libraries (pandas, numpy, scikit-learn, matplotlib, etc.), **YOU MUST CREATE A SEPARATE CODE CELL AT THE VERY TOP** containing: "!pip install library_name". This cell must be the first cell in the notebook.
6. **VISUALIZATION:** If you identify data analysis code (e.g., DataFrames), look for opportunities to visualize the data. In the preceding MARKDOWN cell, add a specific suggestion for a visualization (e.g., "Consider adding: \`sns.histplot(df['column'])\` to visualize distribution").
7. Ensure imports are in the first code cell (after the pip install cell).
8. If the script is long, break it down into chunks (Imports, Data Loading, Preprocessing, Modeling).
9. Do not execute the code, only structure it.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Convert the following Python script into a Jupyter Notebook structure:\n\n${scriptContent}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cell_type: {
                type: Type.STRING,
                enum: ["code", "markdown"],
                description: "The type of the notebook cell."
              },
              source: {
                type: Type.STRING,
                description: "The content of the cell. For code, it is the raw code. For markdown, it is the markdown text."
              }
            },
            required: ["cell_type", "source"]
          }
        }
      }
    });

    const rawJson = response.text;
    if (!rawJson) throw new Error("No response from Gemini");

    const parsedData = JSON.parse(rawJson);

    const notebookCells: NotebookCell[] = parsedData.map((item: any) => {
      const sourceLines = item.source.split('\n').map((line: string, index: number, array: string[]) => {
          return index < array.length - 1 ? line + '\n' : line;
      });

      return {
        id: crypto.randomUUID(), // Generate a unique ID for drag-and-drop
        cell_type: item.cell_type,
        metadata: {},
        source: sourceLines,
        execution_count: item.cell_type === 'code' ? null : undefined,
        outputs: item.cell_type === 'code' ? [] : undefined
      };
    });

    return notebookCells;

  } catch (error) {
    console.error("Error converting script:", error);
    throw error;
  }
};