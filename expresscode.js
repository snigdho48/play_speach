import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";
import axios from "axios";
import ip from "ip";
import { franc } from "franc-min";

const organization = process.env.OPENAI_ORGANIZATION_ID;
const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ organization: organization, apiKey: apiKey });
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Endpoint to receive user input and get response from OpenAI
app.post("/receive_message", async (req, res) => {
  try {
    const userInput = req.body.content || "No content provided";

    // OpenAI Chat completion
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            userInput +
            " output will be the same language. If language is Bangla, then output will be Bangla language; otherwise, it will be in English language.",
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const responseText = chatCompletion.choices[0].message.content;

    // Detect language using franc-min
    const detectedLangCode = franc(responseText);
    let detectedLang = "en"; // Default to English

    if (detectedLangCode === "ben") {
      detectedLang = "bn"; // Bengali
    } else {
      detectedLang = "en"; // English
    }

    console.log("Detected Language Code:", detectedLangCode);
    const encodedText = encodeURIComponent(responseText);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${detectedLang}&client=tw-ob&q=${encodedText}`;

    // Call TTS (Text-to-Speech) service
    const audioResponse = await axios.get(ttsUrl, {
      responseType: "arraybuffer",
    });

    if (!audioResponse || !audioResponse.data) {
      throw new Error("Failed to fetch TTS audio.");
    }

    // Convert audio to base64
    const audioBase64 = Buffer.from(audioResponse.data).toString("base64");

    res.json({
      message: "Message received successfully",
      completion: responseText,
      lang: detectedLang,
      audioData: `data:audio/mpeg;base64,${audioBase64}`, // Send audio as base64
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const server = app.listen(PORT, "0.0.0.0", () => {
  const ipAddress = ip.address();
  console.log(`Server is running at http://${ipAddress}:${PORT}`);
});

server.on("error", (error) => {
  console.error("Error starting server:", error);
});
