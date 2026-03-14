import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatCompletion } from '@/lib/groq';
import { AGENT_PROMPTS, AgentType } from '@/lib/agents';
import { getUserGoals } from '@/lib/models/user-goals';
import { createMealPlan, getTodayMealPlan, deleteMealPlan } from '@/lib/models/meal-plan';
import { PlannedMeal } from '@/lib/models/meal-plan';

const AGENT_DETECTION_PROMPT = `You are an agent routing system. Analyze the user's message and determine which specialized agent should handle their request.

Available agents:
1. "coach" - For training, workouts, exercise, physical performance, recovery, strength, cardio, fitness goals, technique, form, sets, reps, muscles, gym, running, cycling, etc.
2. "psychologist" - For mental health, emotions, stress, anxiety, motivation, mindset, confidence, sleep issues, burnout, pressure, competition nerves, visualization, meditation, mental blocks, self-doubt, emotional issues, therapy, feelings, etc.
3. "nutritionist" - For food, meals, diet, nutrition, calories, macros, protein, carbs, fat, weight loss, bulking, meal planning, supplements, hydration, eating habits, recipes, cooking, healthy eating, etc.

Respond with ONLY a JSON object in this exact format:
{"agent": "coach" | "psychologist" | "nutritionist", "reason": "brief explanation"}

Example responses:
{"agent": "coach", "reason": "User is asking about their training plan"}
{"agent": "psychologist", "reason": "User is expressing stress about competition"}
{"agent": "nutritionist", "reason": "User wants meal prep advice"}

Now analyze this message:`;

export async function POST(request: NextRequest) {
  try {
    const { messages, imageUrl, goals, agent: requestedAgent } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const userMessages = messages.filter((m: any) => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1]?.content;

    let selectedAgent: AgentType = requestedAgent || 'coach';

    if (lastUserMessage && !requestedAgent) {
      try {
        const detectionResponse = await chatCompletion([
          { role: 'system', content: AGENT_DETECTION_PROMPT },
          { role: 'user', content: lastUserMessage }
        ], {
          temperature: 0.1,
          maxTokens: 100,
        });

        const cleanedResponse = detectionResponse.trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.agent && ['coach', 'psychologist', 'nutritionist'].includes(parsed.agent)) {
            selectedAgent = parsed.agent;
          }
        }
      } catch (detectionError) {
        console.error('Agent detection failed, defaulting to coach:', detectionError);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || '';
    
    const today = new Date().toISOString().split('T')[0];
    const existingMealPlan = userId ? await getTodayMealPlan(userId) : null;
    
    let isMealPlanRequest = false;
    let isRegenerateRequest = false;
    
    const explicitMealPlanPhrases = [
      'create a meal plan', 'make a meal plan', 'generate a meal plan',
      'give me a meal plan', 'plan my meals', 'plan my day',
      'i need a meal plan', 'new meal plan', 'different meal plan',
      'regenerate meal plan', 'new plan for today'
    ];
    
    const isExplicitRequest = lastUserMessage && explicitMealPlanPhrases.some(phrase => 
      lastUserMessage.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (isExplicitRequest && userId) {
      isMealPlanRequest = true;
      isRegenerateRequest = true;
    }
    
    if (!isMealPlanRequest && lastUserMessage && userId) {
      const mealPlanPhrases = [
        'what should i eat', 'what to eat', 'what can i have for',
        'breakfast', 'lunch', 'dinner', 'snack',
        'hungry', 'eating plan', 'meal idea'
      ];
      
      const hasMealPhrase = mealPlanPhrases.some(phrase => 
        lastUserMessage.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (hasMealPhrase) {
        try {
          const contextPrompt = `Analyze this conversation and determine if the user is explicitly asking for a NEW meal plan to be created, or just asking a question about food/nutrition.
          
Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Respond with ONLY a JSON object:
{"needsMealPlan": true/false, "reason": "brief explanation"}

Key distinction:
- "what should i eat for lunch?" = might just want advice, not a full plan
- "create a meal plan for me" = wants a new plan created
- "generate meal plan" = wants a new plan created
- "what's for breakfast" = just asking, not requesting plan
- If unsure, respond false - don't auto-create plans`;

          const detectionResponse = await chatCompletion([
            { role: 'system', content: contextPrompt }
          ], {
            temperature: 0.1,
            maxTokens: 150,
          });

          const jsonMatch = detectionResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            isMealPlanRequest = parsed.needsMealPlan === true;
          }
        } catch (err) {
          console.error('Meal plan detection failed:', err);
        }
      }
    }

    if (isMealPlanRequest && userId) {
      try {
        const userGoals = await getUserGoals(userId);
        
        if (userGoals) {
          if (isRegenerateRequest) {
            await deleteMealPlan(userId, today);
          }
          
          const systemPrompt = `You are **Chef PEAK**, a sports nutritionist. Create a personalized daily meal plan.

## User's Goals
- Daily Calories: ${userGoals.dailyCalorieGoal} kcal
- Goal Type: ${userGoals.goalType}
- Protein: ${userGoals.proteinGoal}g | Carbs: ${userGoals.carbsGoal}g | Fat: ${userGoals.fatGoal}g

## Your Job
Create a complete daily meal plan. YOU decide:
- How many meals (can be 2-6 meals depending on the person's schedule and preferences)
- What times to eat (breakfast, lunch, dinner, snacks, etc.)
- Each meal name, calories, and macros

The meals should:
1. Add up to approximately the daily calorie goal
2. Be realistic, practical, and delicious
3. Consider the goal type:
   - CUT: Higher protein, moderate carbs, lower fat, calorie deficit
   - BULK: Higher calories, high carbs, moderate protein, calorie surplus
   - MAINTAIN: Balanced macros, at maintenance calories

## Output Format (JSON ONLY - no other text)
Respond with a JSON array of meals:
[
  {"timing": "breakfast", "name": "Oatmeal with protein powder and berries", "calories": 450, "protein": 35, "carbs": 55, "fat": 12},
  {"timing": "lunch", "name": "Grilled chicken breast with rice", "calories": 550, "protein": 45, "carbs": 60, "fat": 15}
]

Only output valid JSON, no explanation.`;

          const response = await chatCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: lastUserMessage }
          ], {
            temperature: 0.9,
            maxTokens: 800,
          });

          let meals: Omit<PlannedMeal, 'id' | 'eaten'>[] = [];
          
          try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              meals = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error('Failed to parse meal plan JSON:', parseError);
          }

          if (meals && meals.length > 0) {
            const mealPlan = await createMealPlan(userId, today, meals, userGoals.goalType as 'bulk' | 'cut' | 'maintain');
            
            const responsePrompt = `The user asked: "${lastUserMessage}"

You just created this meal plan for them:
${meals.map(m => `${m.timing.toUpperCase()}: ${m.name} - ${m.calories}kcal (P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`).join('\n')}

Total: ${mealPlan.totalCalories} kcal for ${userGoals.goalType} goal

Respond naturally and conversationally. Be different every time - vary your:
- Greeting style (casual, enthusiastic, professional, friendly)
- How you present the plan
- What you emphasize (taste, nutrition, convenience, energy, etc.)
- Wording and structure

Keep it under 150 words. Don't use bullet points every time - sometimes write as paragraphs.`;

            const aiResponse = await chatCompletion([
              { role: 'system', content: responsePrompt }
            ], {
              temperature: 1.0,
              maxTokens: 200,
            });
            
            return NextResponse.json({ 
              response: aiResponse,
              detectedAgent: selectedAgent,
              mealPlan: mealPlan,
            });
          }
        }
      } catch (err) {
        console.error('Failed to generate meal plan from coach:', err);
      }
    }

    const basePrompt = AGENT_PROMPTS[selectedAgent];

    const goalTypeLabel = goals?.goalType === 'bulk' ? 'Bulking (calorie surplus)' 
      : goals?.goalType === 'cut' ? 'Cutting (calorie deficit)' 
      : 'Maintenance';

    let mealPlanContext = '';
    if (existingMealPlan && existingMealPlan.meals) {
      const eatenMeals = existingMealPlan.meals.filter((m: any) => m.eaten).length;
      mealPlanContext = `
## Today's Meal Plan (already exists)
- Total: ${existingMealPlan.totalCalories} kcal (${existingMealPlan.goalType})
- Progress: ${eatenMeals}/${existingMealPlan.meals.length} meals eaten
${existingMealPlan.meals.map((m: any) => `- ${m.timing}: ${m.name} (${m.calories} kcal) ${m.eaten ? '✓' : ''}`).join('\n')}

When user asks about meals or food, reference this plan!`;
    }

    const DYNAMIC_CONTEXT = goals ? `
## User's Nutrition Goals
- **Daily Calorie Goal**: ${goals.dailyCalorieGoal} kcal
- **Goal Type**: ${goalTypeLabel}
- **Macro Goals**: Protein ${goals.proteinGoal}g | Carbs ${goals.carbsGoal}g | Fat ${goals.fatGoal}g
${mealPlanContext}` : mealPlanContext ? `\n${mealPlanContext}` : '';

    const systemPromptWithGoals = basePrompt.replace(
      '## Athlete Context',
      `${DYNAMIC_CONTEXT}\n\n## Athlete Context`
    );

    const formattedMessages: { role: 'user' | 'assistant' | 'system'; content: string | { type: 'image_url'; image_url: { url: string } }[] }[] = [
      { role: 'system', content: systemPromptWithGoals },
    ];

    for (const msg of messages) {
      if (msg.role === 'user' && imageUrl) {
        formattedMessages.push({
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            msg.content,
          ],
        });
      } else {
        formattedMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    const response = await chatCompletion(formattedMessages);

    return NextResponse.json({ 
      response,
      detectedAgent: selectedAgent,
    });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Coach' },
      { status: 500 }
    );
  }
}
