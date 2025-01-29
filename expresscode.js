import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";
import ip from "ip";
import dotenv from "dotenv";
dotenv.config();
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
          content: userInput,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    const responseText = chatCompletion.choices[0].message.content;

    res.json({
      message: "Message received successfully",
      completion: responseText,
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
