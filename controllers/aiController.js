const HealthProfile = require('../models/HealthProfile');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');

const generateChatResponse = async (req, res) => {
  try {
    const { message } = req.body;
    
    // In a production app, you would pass this message along with the user's context
    // to an LLM like OpenAI (GPT-4) or Google Gemini.
    // Example: const aiResponse = await openai.createChatCompletion({...})

    // Fetch user context to make the mock response feel smart
    const profile = await HealthProfile.findOne({ user: req.user._id });
    
    const lowerMessage = message.toLowerCase();
    let reply = "I am your Smart Health Advisor AI. How can I help you today?";

    if (lowerMessage.includes('protein') || lowerMessage.includes('diet') || lowerMessage.includes('food')) {
      if (profile && profile.dietType === 'vegan') {
        reply = "Since you're on a vegan diet, great sources of protein include tofu, lentils, chickpeas, and quinoa. Would you like a recipe recommendation?";
      } else {
        reply = "For your goals, lean meats like chicken breast, fish, and Greek yogurt are excellent protein sources. Make sure to hit your daily macro targets!";
      }
    } else if (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('sore')) {
      if (profile && profile.primaryGoal === 'build_muscle') {
        reply = "Building muscle takes time! If you're feeling sore, remember that rest and protein intake are just as important as the lifting itself. Don't skip your recovery days.";
      } else {
        reply = "Consistency is key! Even a short 20-minute workout is better than nothing. Try to focus on your form and keep your heart rate up.";
      }
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
      reply = `You are currently focusing on ${profile ? profile.primaryGoal.replace('_', ' ') : 'your health'}. Stay consistent with your daily dashboard plans and we will adapt them as you progress!`;
    } else {
      reply = `I heard you say: "${message}". As an AI Advisor, I'm here to answer your fitness and nutrition questions. (Note: Connect your OpenAI/Gemini API key in the backend to enable full conversational AI).`;
    }

    res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error generating AI response' });
  }
};

module.exports = {
  generateChatResponse
};
