require('dotenv').config(); // <-- load env variables
const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const AdmZip = require('adm-zip');
const path = require('path');

const app = express();
const port = 3000;

// OpenAI configuration
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // <-- use dotenv variable
    baseURL: "https://api.groq.com/openai/v1",
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// ... rest of your code stays the same

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        const prompt = `
        You are an expert full-stack developer. 
        When asked to create an app, respond ONLY with a JSON object containing the file structure.
        The JSON should be in this format:
        {
            "files": [
                { "path": "filename.ext", "content": "file content" },
                { "path": "folder/filename.ext", "content": "file content" }
            ],
            "explanation": "Brief explanation of the app"
        }
        User request: ${message}
        `;

        // Send prompt to OpenAI
        const response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: prompt,
        });

        // Extract text output
        let text = response.output_text || "";
        
        // Extract JSON from possible markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        try {
            const jsonResponse = JSON.parse(text);
            res.json(jsonResponse);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw text:", text);
            res.json({ explanation: text, files: [] });
        }
    } catch (err) {
        console.error("OpenRouter Error Details:", err);
        const errorMessage = err.error?.message || err.message || "Error from OpenRouter API";
        res.status(err.status || 500).json({ error: errorMessage });
    }
});

app.post('/api/download', (req, res) => {
    const { files } = req.body;
    const zip = new AdmZip();

    files.forEach(file => {
        zip.addFile(file.path, Buffer.from(file.content, 'utf8'));
    });

    const zipBuffer = zip.toBuffer();
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=generated-app.zip');
    res.send(zipBuffer);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
