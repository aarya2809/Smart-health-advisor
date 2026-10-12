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
      // Compute authoritative targets for AI context
      let proteinInfo = '';
      if (profile.weight && profile.height) {
        const { calculateBMR, calculateTDEE } = require('../utils/metricsCalculator');
        const { calculateIndividualizedTargets } = require('../utils/proteinCalculator');
        const bmrObj = calculateBMR(profile.weight, profile.height, profile.age || 25, profile.gender || 'male');
        const bmrVal = bmrObj ? bmrObj.value : (10 * profile.weight + 6.25 * profile.height - 5 * 25 + 5);
        const tdeeObj = calculateTDEE(bmrVal, profile.activityLevel || 'moderately_active');
        const tdeeVal = tdeeObj ? tdeeObj.value : Math.round(bmrVal * 1.55);
        const targets = calculateIndividualizedTargets({
          tdee: tdeeVal,
          weightKg: profile.weight,
          heightCm: profile.height,
          age: profile.age,
          gender: profile.gender,
          goal: profile.primaryGoal,
          activityLevel: profile.activityLevel,
          dietType: profile.dietType
        });
        proteinInfo = `Authoritative Nutrition Targets: Calories ${targets.calorieTarget} kcal/day, Protein ${targets.proteinTargetGrams} g/day (${targets.proteinPerKg} g/kg on ${targets.referenceWeightKg}kg reference weight for ${profile.primaryGoal.replace('_', ' ')}).`;
      }

      systemInstruction += `\nUser Profile context: Age ${profile.age}, Weight ${profile.weight}kg, Height ${profile.height}cm. Activity level: ${profile.activityLevel}. Goal: ${profile.primaryGoal.replace('_', ' ')}. Diet type: ${profile.dietType}. ${proteinInfo} Remember this when giving advice! Keep answers under 3 paragraphs.`;
      
      // Safety overrides
      if (profile.hasFoodAllergies === 'yes') {
        const allergens = profile.allergies.map(a => a.allergen).join(', ');
        systemInstruction += `\nCRITICAL SAFETY RULE: The user has declared food allergies to: ${allergens}. You MUST NEVER recommend these foods.`;
      }
      if (profile.hasInjuries === 'current' || profile.hasInjuries === 'past' || (profile.injuries && profile.injuries.length > 0)) {
        const injuryDetails = (profile.injuries || []).map(i => `${i.bodyPart} (avoid ${i.movementsToAvoid ? i.movementsToAvoid.join(', ') : 'knee/joint stress'})`).join('; ');
        systemInstruction += `\nCRITICAL INJURY SAFETY RULE: The user has declared physical injuries: ${injuryDetails}.
If they have a KNEE injury, you are STRICTLY FORBIDDEN from recommending squats, lunges, leg presses, box jumps, jumping jacks, or high-impact running. Recommend only upper body and knee-friendly core movements (e.g. chest press, rows, bird dog, glute bridges).`;
      }
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
