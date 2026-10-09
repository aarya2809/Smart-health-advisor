const HealthProfile = require('../models/HealthProfile');
const { GoogleGenAI } = require('@google/genai');

const generateChatResponse = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Make sure API key is provided
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ 
        success: true, 
        reply: "Hello! I am your AI. To unlock my full conversational abilities, please add your GEMINI_API_KEY to the server environment variables!" 
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const profile = await HealthProfile.findOne({ user: req.user._id });
    let systemInstruction = "You are a professional, empathetic, and knowledgeable personal trainer and nutritionist AI called 'Smart Health Advisor'. Give concise, practical advice.";
    
    if (profile) {
      systemInstruction += `\nUser Profile context: Age ${profile.age}, Weight ${profile.weight}kg, Height ${profile.height}cm. Activity level: ${profile.activityLevel}. Goal: ${profile.primaryGoal.replace('_', ' ')}. Diet type: ${profile.dietType}. Remember this when giving advice! Keep answers under 3 paragraphs.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.status(200).json({ success: true, reply: response.text });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ success: false, message: 'Server error generating AI response' });
  }
};

module.exports = {
  generateChatResponse
};
