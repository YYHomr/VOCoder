require('dotenv').config(); // load .env variables
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai');
const AdmZip = require('adm-zip');

const app = express();
const port = process.env.PORT || 3000;

// Serve static frontend
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI configuration
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

// Chat API
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    try {
        const prompt = `
        You are an expert full-stack developer. You are a fornt-end developer with a background in back-end development.
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

        const response = await client.responses.create({
            model: "openai/gpt-oss-20b",
            input: prompt,
        });

        let text = response.output_text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

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

// Download API
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

// Catch-all route to serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
