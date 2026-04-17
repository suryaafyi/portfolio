import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// 🔪 Chunk function
function chunkText(text, size = 800) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

async function run() {
    const text = fs.readFileSync("./case-study.txt", "utf-8");

    const chunks = chunkText(text, 800);

    console.log("📦 Total chunks:", chunks.length);

    for (const chunk of chunks) {
        // 🧠 NEW SDK embedding call requires direct string input for contents
        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: chunk,
        });

        const embedding = response.embeddings[0].values;

        const { error } = await supabase.from("documents").insert({
            content: chunk,
            embedding,
        });

        if (error) {
            console.error("INSERT ERROR:", error);
        } else {
            console.log("✅ Stored chunk");
        }
    }

    console.log("🎉 Embedding complete!");
}


run();