const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const pdf = require('pdf-parse');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs').promises;
const multer = require('multer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const ytdl = require('ytdl-core');
const { getSubtitles } = require("youtube-caption-extractor");
const profileRoute = require('./routes/profile.js'); // Adjust path as needed
const dataRoutes = require('./routes/data');
const flashcardRoutes = require('./routes/flashcards');
const quizRouter = require('./routes/quiz');
const mindmapRouter = require('./routes/mindmap.js')
const summariesRouter = require('./routes/summaries.js')

const connectDB = require('./config/db');
connectDB();

const app = express();
const port = process.env.PORT || 3001;



// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));


app.use(express.json());
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use("/api/profile", profileRoute);
app.use('/api/data', dataRoutes);


const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

(async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (err) {
    console.error('Could not create uploads directory:', err);
  }
})();

// Middleware

app.use(express.json());

// Initialize Groq API
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Function to extract text from PDF
async function extractTextFromPdf(filePath) {
  try {
    console.log(`Extracting text from PDF: ${filePath}`);
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    
    console.log(`Successfully extracted ${data.text.length} characters from PDF`);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Function to generate mind map data using Groq
async function generateMindMapWithGroq(text) {
  try {
    console.log("Received text for processing:", text.substring(0, 100) + "...");

    // Use Groq's LLaMA model

    // Create prompt for mind map generation
    const prompt = `
    Format your output as a **JSON array** using this structure:
[
  {
    "id": "1",
    "label": "Main Concept",
    "description": "Brief explanation",
    "importance": 5
  },
  {
    "id": "2",
    "label": "Subconcept 1",
    "description": "Explanation of this subconcept",
    "importance": 3,
    "parent": "1"
  }
]

Rules:
- Only the main concept should have no parent.
- Every node must have a unique string ID.
- Each node (except the root) must have one parent.
- Each parent must have no more than 3 children unless strongly needed.
- Structure should be 3–5 levels deep.
- have atleast 12 nodes 
- Optional: Use "relatedTo" to show cross-links.

    Input text: ${text}`;

    console.log("Sending prompt to Groq...");

    // Generate content using Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096
    });

    const textResponse = completion.choices[0]?.message?.content || "";

    console.log("Received raw response from Groq:", textResponse.substring(0, 200) + "...");

    // Extract JSON from response (handle potential text wrapping)
    const jsonMatch = textResponse.match(/\[.*\]/s); // Extracts JSON content
    if (!jsonMatch) {
      console.error("No valid JSON array found in response.");
      throw new Error("Invalid JSON format from Groq API");
    }
    const jsonStr = jsonMatch[0];


    console.log("Extracted JSON:", jsonStr.substring(0, 200) + "...");

    try {
      // Parse the response into JSON
      const mindMapData = JSON.parse(jsonStr);

      // Process the data to create nodes and edges
      const nodes = mindMapData.map(item => ({
        id: item.id,
        type: 'custom',
        data: {
          label: item.label,
          description: item.description || "",
          importance: item.importance || 1
        },
        position: { x: 0, y: 0 } // Positions will be calculated on the client
      }));

      // Create edges based on parent relationships
      const edges = [];

      mindMapData.forEach(item => {
        if (item.parent) {
          edges.push({
            id: `e${item.parent}-${item.id}`,
            source: item.parent,
            target: item.id,
            animated: true,
            style: { stroke: '#1d4ed8', strokeWidth: 2 }
          });
        }

        // Add edges for related items
        if (item.relatedTo && Array.isArray(item.relatedTo)) {
          item.relatedTo.forEach(relatedId => {
            edges.push({
              id: `e${relatedId}-${item.id}-related`,
              source: relatedId,
              target: item.id,
              animated: false,
              style: {
                stroke: '#3b82f6',
                strokeWidth: 1.5,
                strokeDasharray: '3,3'
              }
            });
          });
        }
      });

      console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);
      return { nodes, edges };
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      console.error("Problem JSON string:", jsonStr);
      throw new Error(`Failed to parse Groq response: ${jsonError.message}`);
    }
  } catch (error) {
    console.error("Error with Groq API:", error);
    throw new Error(`Groq API error: ${error.message}`);
  }
}



async function processDocument(file) {
  let extractedText = '';
  
  try {
    console.log(`Processing file: ${file.originalname}, Type: ${file.mimetype}`);
    
    if (file.mimetype === 'application/pdf') {
      extractedText = await extractTextFromPdf(file.path);
    } else if (file.mimetype === 'text/plain') {
      extractedText = await fs.readFile(file.path, 'utf-8');
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('Extracted text is empty');
    }
    
    return extractedText;
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  } finally {
    // Clean up the uploaded file
    try {
      if (file.path) {
        await fs.unlink(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      }
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
  }
}

// Add this helper function with your other Groq functions
async function generateSummaryWithGroq(text) {
  try {
    
    const prompt = `Provide the summary in clean plain text format:
    - DO NOT use markdown (** or any formatting)
    - Use ONLY these formatting rules:
      • Main sections in ALL CAPS (no symbols)
      - Sub-points with regular bullet points
      -- Nested points with double dashes
    - Example:
      OPERATING SYSTEM BASICS
      - System software managing resources
      -- Manages both hardware and software
    
    Text to summarize:
    ${text.substring(0, 30000)}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 4096
    });

    const responseText = completion.choices[0]?.message?.content || "";
    // Remove any remaining markdown
    return responseText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '•');
  } catch (error) {
    console.error('Summary generation error:', error);
    throw new Error('Failed to generate summary');
  }
}


async function getYouTubeCaptions(videoId) {
  try {
    const info = await ytdl.getInfo(videoId);
    
    // Method 1: Check for automatic captions
    let captions = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    // Method 2: Alternative caption location (some videos)
    if (!captions || captions.length === 0) {
      captions = info.player_response?.captions?.playerCaptionsTracklistRenderer?.translationLanguages;
    }

    // Method 3: Fallback to manual extraction if no captions
    if (!captions || captions.length === 0) {
      console.log('No captions found, falling back to transcript extraction');
      const transcript = await extractTranscriptFromVideo(videoId);
      return {
        transcript,
        videoDetails: {
          title: info.videoDetails.title,
          duration: info.videoDetails.lengthSeconds
        }
      };
    }

    // Find English captions or fallback to first available
    const englishTrack = captions.find(track => track.languageCode === 'en') || captions[0];
    
    if (!englishTrack?.baseUrl) {
      throw new Error('No caption track URL available');
    }

    const transcriptResponse = await fetch(englishTrack.baseUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch captions: ${transcriptResponse.statusText}`);
    }
    
    const transcript = await transcriptResponse.text();
    
    return {
      transcript,
      videoDetails: {
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds
      }
    };
  } catch (error) {
    console.error('Caption extraction failed:', error);
    throw new Error(`Could not get captions: ${error.message}`);
  }
}


async function detectLanguage(text) {
  try {
    const prompt = `Identify the language of the following text. Respond ONLY with the ISO 639-1 language code (e.g., "en", "es", "fr"):
    
    Text: ${text.substring(0, 1000)}`;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 10
    });

    return completion.choices[0]?.message?.content?.trim() || "en";
  } catch (error) {
    console.error("Language detection error:", error);
    return "en"; // Fallback to English
  }
}

async function extractTranscriptFromVideo(videoId) {
  try {
    // Try to get video description as fallback
    const info = await ytdl.getInfo(videoId);
    return info.videoDetails.description || 
           "No captions available for this video. Please try a different video with captions.";
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return "Could not extract any content from this video.";
  }
}

async function getTranscript(videoId, lang = "en") {
  try {
    const transcript = await getSubtitles({
      videoID: videoId,
      lang: lang,
    });

    if (!transcript.length) {
      console.log(`No transcript available in ${lang}`);
      return null;
    }

    return {
      text: transcript.map(entry => entry.text).join(" "),
      language: lang
    };
  } catch (error) {
    console.error(`Error fetching ${lang} transcript:`, error);
    return null;
  }
}

app.use('/api/summaries', summariesRouter);

// API Endpoint for generating mind map from text
app.post('/api/generate-mind-map', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const mindMapData = await generateMindMapWithGroq(text);
    res.json(mindMapData);
  } catch (error) {
    console.error('Error generating mind map:', error);
    res.status(500).json({ error: 'Failed to generate mind map' });
  }
});

app.use('/api/mindmap', mindmapRouter);

// Updated API Endpoint for processing documents
// Enhanced document processing endpoint
app.post('/api/process-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please select a PDF or text file to upload'
      });
    }

    console.log(`Received file: ${req.file.originalname}`);
    
    const extractedText = await processDocument(req.file);
    const mindMapData = await generateMindMapWithGroq(extractedText);
    
    res.json({
      success: true,
      text: extractedText,
      mindMap: mindMapData
    });
    
  } catch (error) {
    console.error('Document processing endpoint error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to process document';
    
    if (error.message.includes('Only PDF and text files')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('empty') || error.message.includes('no extractable text')) {
      statusCode = 400;
      errorMessage = 'The document appears to be empty or contains no extractable text';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Add this endpoint to your existing server.js file
app.post('/generate-flashcards', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text input is required' });
    }
    
    console.log("Received text for flashcard generation:", text.substring(0, 100) + "...");
    
    const prompt = `
    Generate a set of flashcards from the following text. 
    Create question-answer pairs that cover the key concepts.
    Format the response as a JSON array with this structure:
    [
      {
        "question": "Clear and concise question",
        "answer": "Detailed and accurate answer"
      },
      ...
    ]
    
    Guidelines:
    - Create 5-10 flashcards depending on the content density if number not specified
    - Questions should test understanding of key concepts
    - Answers should be detailed but concise
    - Cover all major topics in the text
    - Avoid trivial questions that just repeat text verbatim
    
    Input text: ${text}`;

    console.log("Sending prompt to Groq for flashcard generation...");
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096
    });

    const textResponse = completion.choices[0]?.message?.content || "";
    
    console.log("Received raw response from Groq:", textResponse.substring(0, 200) + "...");
    
    const jsonMatch = textResponse.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("No valid JSON array found in response.");
      throw new Error("Invalid JSON format from Groq API");
    }
    
    const flashcards = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("No flashcards were generated");
    }
    
    console.log(`Generated ${flashcards.length} flashcards`);
    res.json({ cards: flashcards });
    
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ 
      error: 'Failed to generate flashcards',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.use('/api/flashcards', flashcardRoutes);


// Add this endpoint to your existing server.js
app.post('/generate-quiz', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text input is required' });
    }
    
    console.log("Received text for quiz generation:", text.substring(0, 100) + "...");
    
    const prompt = `
    Generate a multiple-choice quiz from the following text. 
    Create 10-15 questions that cover the key concepts.
    Format the response as a JSON array with this structure:
    [
      {
        "question": "Clear and concise question",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "Correct option",
        "explanation": "Brief explanation of why this is correct"
      },
      ...
      ]
      
    Guidelines:
    - Questions should test understanding of key concepts
    - Provide 4 plausible options per question
    - Only one correct answer per question
    - Options should be of similar length and complexity
    - Avoid trivial questions that just repeat text verbatim
    - Include explanations for the correct answers
    
    Input text: ${text}`;

    console.log("Sending prompt to Groq for quiz generation...");
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 4096
    });

    const textResponse = completion.choices[0]?.message?.content || "";
    
    console.log("Received raw response from Groq:", textResponse.substring(0, 200) + "...");
    
    const jsonMatch = textResponse.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.error("No valid JSON array found in response.");
      throw new Error("Invalid JSON format from Groq API");
    }
    
    const quizQuestions = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
      throw new Error("No quiz questions were generated");
    }
    
    console.log(`Generated ${quizQuestions.length} quiz questions`);
    res.json({ questions: quizQuestions });
    
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.use('/api/quizzes', quizRouter);


// Add this endpoint with your other routes
app.post('/api/summarize-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Use your existing text extraction function
    const text = await extractTextFromPdf(req.file.path);
    
    // Generate summary using Groq
    const summary = await generateSummaryWithGroq(text);

    res.json({
      success: true,
      summary: summary,
      originalLength: text.length,
      summaryLength: summary.length
    });

  } catch (error) {
    console.error('PDF summarization error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to summarize PDF',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // Clean up uploaded file using your existing pattern
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }
  }
});

// Update the /api/youtube-transcript endpoint
app.post('/api/youtube-transcript', async (req, res) => {
  try {
    const { videoId, language = "en" } = req.body;

    if (!videoId) {
      return res.status(400).json({ 
        success: false,
        error: 'YouTube video ID is required' 
      });
    }

    // For auto-detect: Try English first (most common), then other languages
    if (language === "auto") {
      const languagesToTry = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'hi', 'pt', 'ru'];
      
      for (const lang of languagesToTry) {
        const transcript = await getTranscript(videoId, lang);
        if (transcript && transcript.text) {
          return res.json({
            success: true,
            transcript: transcript.text,
            language: lang,
            detected: true
          });
        }
      }
      
      return res.status(404).json({ 
        success: false, 
        error: "No captions found in any supported language" 
      });
    }
    
    // For specific language request
    const transcript = await getTranscript(videoId, language);
    if (!transcript || !transcript.text) {
      return res.status(404).json({ 
        success: false, 
        error: `No captions available in ${language}` 
      });
    }

    res.json({
      success: true,
      transcript: transcript.text,
      language: language
    });
  } catch (error) {
    console.error('Transcript error:', error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

// Then update the YouTube endpoint to include detection
app.post('/api/summarize-youtube', async (req, res) => {
  try {
    const { videoId, transcript, language = "en" } = req.body;

    if (!videoId || !transcript) {
      return res.status(400).json({ 
        success: false,
        error: 'YouTube video ID and transcript are required' 
      });
    }

    // Detect language if auto mode was used
    let actualLanguage = language;
    if (language === "auto") {
      actualLanguage = await detectLanguage(transcript);
    }

    // Prepare text for summarization
    const textToSummarize = actualLanguage !== "en" 
      ? `[Content originally in ${actualLanguage} - provide English summary]\n\n${transcript}`
      : transcript;

    const summary = await generateSummaryWithGroq(textToSummarize);

    res.json({
      success: true,
      summary,
      originalLanguage: actualLanguage,
      summaryLanguage: "en" // Always English output
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});


// Chat endpoint for StudyBuddy chatbot
app.post('/chat', async (req, res) => {
  try {
    const { message, availablePaths = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log("Received chat message:", message);

    // Enhanced prompt that supports both navigation and content suggestions
    const prompt = `
      You are StudyBuddy, an educational AI assistant for a learning website. 
      
      Available navigation paths on the website:
      ${availablePaths.map(path => `- ${path}`).join('\n')}
      
      CRITICAL RULE FOR NAVIGATION:
      Only if the user's message explicitly indicates they want to go to or use a specific section/feature, include a navigation command at the END of your response in this format: [NAV:/path/to/page]
      
      Mapping of user intent/keywords to paths:
      - "mindmap" or "mind map" -> [NAV:/mindmap]
      - "summary", "summarize", or "summarization" -> [NAV:/summarization]
      - "quiz" or "quizzes" -> [NAV:/quiz]
      - "flashcard" or "flash cards" -> [NAV:/flashcards]
      
      If the user is asking a general question (e.g. explaining a concept, asking for a definition like "what is the full form of aws", or chatting) and does not explicitly request one of these study aids, DO NOT include any navigation command.
      
      Keep your response helpful, accurate, and relatively brief.
      Do not use markdown formatting like ** for bold or * for italics.
      
      Please respond to this student question or message:
      "${message}"
    `;

    // Generate content using Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 2048
    });

    let reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Process the reply to properly URL encode the prompt parameter
    const navMatch = reply.match(/\[NAV:([^\]]+)\]/);
    // if (navMatch) {
    //   const navCommand = navMatch[1];
    //   const [path, suggestedPrompt] = navCommand.split('||');

    //   // Check if this is a path that needs a prompt parameter
    //   if (path.includes('/quiz') || path.includes('/mindmap') ||
    //     path.includes('/flashcards') || path.includes('/summarization')) {

    //     // Extract base path and any existing parameters
    //     const [basePath, existingParams] = path.split('?');

    //     // If there's a suggested prompt, use it as the prompt parameter
    //     if (suggestedPrompt) {
    //       const encodedPrompt = encodeURIComponent(suggestedPrompt);
    //       const newPath = `${basePath}?prompt=${encodedPrompt}`;

    //       // Replace the original navigation command with the updated one
    //       reply = reply.replace(navMatch[0], `[NAV:${path}||${suggestedPrompt}]`);
    //     }
    //   }
    // }

    res.json({ reply });

  } catch (error) {
    console.error('Chat error:', error);

    res.status(500).json({
      error: 'Failed to process message',
      reply: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
    });
  }
});

// Simple health check endpoint
app.get('/chat/health', (req, res) => {
  res.json({ status: 'ok', message: 'StudyBuddy chat service is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

