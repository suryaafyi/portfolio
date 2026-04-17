import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";


import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧠 Your system prompt
const SYSTEM_PROMPT = `
You are an AI representation of Surya, a Product Designer. You are chatting with a recruiter or designer about your case study "Knot".

Guidelines:
1. CONVERSATIONAL AWARENESS: If the user just says "hey", "hi", or asks a general greeting, simply say hello back as Surya and ask what they'd like to know about Knot! DO NOT generate project insights for a simple 'hello'.
2. PROJECT QUESTIONS: If they ask about the case study, answer smoothly using ONLY the provided Context chunks.
   - Sound confident and natural, explaining your reasoning (why you did it, not just what you did).
   - Keep answers concise (3-5 lines).
   - Avoid generic UX buzzwords.
3. FALLBACK: If the info is missing from the context, say EXACTLY: "That wasn't explored deeply in this project."

Output Format:
You MUST return your response as a valid JSON object matching exactly this structure:
{
  "answer": "your main answer or greeting here",
  "followUp": "A highly organic, conversational follow-up question directly related to what you just explained. If you are just greeting them, suggest a specific topic they can ask you about. Frame it uniquely every single time. If no logical follow-up exists, use an empty string."
}
`;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  try {
    // 1. Generate an embedding vector for the user's question
    const embedResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: message,
    });

    const queryEmbedding = embedResponse.embeddings[0].values;

    // 2. Query Supabase for top 5 similar chunks
    const { data: matchData, error: matchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 12,
    });

    if (matchError) {
      console.error("Supabase RPC Error:", matchError);
      throw matchError;
    }

    // 3. Combine chunks into a context string
    let contextString = "";
    if (matchData && matchData.length > 0) {
      contextString = matchData.map(doc => doc.content).join("\n\n---\n\n");
    } else {
      contextString = "No specific context available.";
    }

    // 4. Construct Final Prompt
    const finalPrompt = `${SYSTEM_PROMPT}

      Context from case study: ${contextString}
      
      Question: ${message}
      
      Respond as Surya using the required JSON format:`;

    // 5. Send to Gemini Chat Model
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    // Parse the JSON output from AI
    const jsonOutput = JSON.parse(response.text);

    res.json({ reply: jsonOutput.answer, followUp: jsonOutput.followUp });
  } catch (err) {
    console.error("RAG Error:", err);
    res.status(500).json({ error: "Failed to process AI chat" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});