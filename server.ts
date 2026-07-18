import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Fallback smart replies when Gemini API key is missing
function getSimulatedReply(
  message: string,
  hostName: string,
  propertyTitle: string,
  propertyDetails: string
): string {
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('pet') || msgLower.includes('dog') || msgLower.includes('cat')) {
    if (propertyDetails.toLowerCase().includes('pet friendly')) {
      return `Hi there! Yes, "${propertyTitle}" is fully pet-friendly! We love hosting pets, though we do have a small standard deposit. Would you like to schedule a viewing to see if it fits you and your furry friend?`;
    } else {
      return `Hi! Regarding pets, we generally prefer no pets at "${propertyTitle}" to keep the space allergen-free, but we might make exceptions for small, well-behaved animals on a case-by-case basis. Let me know if that works for you!`;
    }
  }

  if (msgLower.includes('park') || msgLower.includes('car') || msgLower.includes('garage')) {
    if (propertyDetails.toLowerCase().includes('parking')) {
      return `Hello! Yes, parking is absolutely included with "${propertyTitle}". There is a dedicated, secure parking spot available for you. Let me know if you have any other questions or if you'd like to check it out!`;
    } else {
      return `Hi! Regarding parking at "${propertyTitle}", there is street parking available nearby, as well as some public garages within walking distance. Let me know if you would like me to share more details on those.`;
    }
  }

  if (msgLower.includes('avail') || msgLower.includes('when') || msgLower.includes('move in')) {
    return `Hi! Thanks for asking. "${propertyTitle}" is available starting from next month! We can schedule a walkthrough anytime this week. What days or times usually work best for you?`;
  }

  if (msgLower.includes('price') || msgLower.includes('rent') || msgLower.includes('deposit') || msgLower.includes('cost')) {
    return `Hello! The rent and security deposit details for "${propertyTitle}" are listed in the overview, but I'm happy to go over the leasing terms with you. We offer flexible 6-month or 12-month leases. Let me know which lease length you are looking for!`;
  }

  if (msgLower.includes('utility') || msgLower.includes('utilities') || msgLower.includes('bill') || msgLower.includes('water') || msgLower.includes('electricity')) {
    return `Hi! For "${propertyTitle}", high-speed Wi-Fi is included in the rent! Other utilities like water and electricity are typically split or billed separately based on usage. Let me know if you'd like a breakdown of the typical monthly utility costs!`;
  }

  // General warm placeholder reply
  return `Hi! Thank you for reaching out about "${propertyTitle}". I am the host, ${hostName}. I'd be absolutely thrilled to answer any questions you have, or schedule a physical or virtual tour of the space. Let me know what you have in mind!`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route for Landlord Response
  app.post('/api/chat-reply', async (req, res) => {
    const { message, hostName, propertyTitle, propertyDetails, chatHistory } = req.body;

    if (!message || !hostName || !propertyTitle || !propertyDetails) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      const client = getGeminiClient();
      
      if (!client) {
        // Fallback gracefully to smart simulated response
        const simulated = getSimulatedReply(message, hostName, propertyTitle, propertyDetails);
        return res.json({
          reply: simulated,
          isSimulated: true,
        });
      }

      const systemInstruction = `You are ${hostName}, the landlord/host of a premium rental property called "${propertyTitle}".
Property Listing Details:
${propertyDetails}

Your goal is to reply to messages from potential tenants in a very warm, professional, hospitable, and friendly landlord tone. 
Keep your responses relatively concise (2-4 sentences max), answer their questions accurately based on the property details provided, and invite them to schedule a viewing or ask further questions.
If they ask about an amenity or detail not mentioned in the property details, politely state whether it is available or offer to look into it, but do not make up fake, unrealistic policies. Always be inviting and conversational.`;

      const prompt = `Potential Tenant says: "${message}"`;

      // Structure conversation history for Gemini if provided
      let contents: any[] = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.slice(-6).forEach((msg: any) => {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const generatedText = response.text || getSimulatedReply(message, hostName, propertyTitle, propertyDetails);

      return res.json({
        reply: generatedText.trim(),
        isSimulated: false,
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      // Fallback on error to ensure robustness
      const simulated = getSimulatedReply(message, hostName, propertyTitle, propertyDetails);
      return res.json({
        reply: simulated,
        isSimulated: true,
        error: error.message,
      });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req, res) => {
        res.status(404).send('Production build not found. Please run npm run build.');
      });
    }
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] House Rental App Server is running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
