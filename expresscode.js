import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";
import axios from "axios";
import ip from "ip";
import "dotenv/config"; // Load environment variables
import https from "https";
import fs from "fs";

// Load environment variables
const organization = process.env.OPENAI_ORGANIZATION_ID;
const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ organization: organization, apiKey: apiKey });
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS setup to allow all origins
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["POST", "GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors());

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

    // Text-to-Speech (TTS) URL
    const encodedText = encodeURIComponent(responseText);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

    // Fetch TTS audio
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
      audioData: `data:audio/mpeg;base64,${audioBase64}`, // Audio as base64
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// SSL Options
const sslOptions = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.cert"),
};

// Start HTTPS Server
const server = https.createServer(sslOptions, app);

server.listen(PORT, "0.0.0.0", () => {
  const ipAddress = ip.address();
  console.log(`Server is running securely at https://${ipAddress}:${PORT}`);
});

server.on("error", (error) => {
  console.error("Error starting server:", error);
});
