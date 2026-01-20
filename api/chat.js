import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed'
        });
    }

  const { message
    } = req.body;

  try {
    const prompt = `
    You are an expert full-stack developer. 
    When asked to create an app, respond ONLY with a JSON object containing the file structure.
    The JSON should be in this format: {
            "files": [
                {
                    "path": "filename.ext",
                    "content": "file content"
                },
                {
                    "path": "folder/filename.ext",
                    "content": "file content"
                }
            ],
            "explanation": "Brief explanation of the app"
        }
    User request: ${message
        }
    `;

    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: prompt,
        });

    let text = response.output_text || "";
    const jsonMatch = text.match(/\{
            [\s\S
            ]*\
        }/);
    if (jsonMatch) text = jsonMatch[
            0
        ];

    try {
      const jsonResponse = JSON.parse(text);
      res.status(200).json(jsonResponse);
        } catch (e) {
      res.status(200).json({ explanation: text, files: []
            });
        }
    } catch (err) {
    res.status(500).json({ error: err.message || "OpenRouter API Error"
        });
    }
}