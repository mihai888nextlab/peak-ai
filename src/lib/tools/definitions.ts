export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'get_user_goals',
    description: `Get user's fitness and nutrition goals. ALWAYS call this FIRST when starting a conversation about training, nutrition, or when creating workout/meal plans.
    
CONTEXT TO CONSIDER:
- Daily calorie target (for workout intensity and meal planning)
- Goal type: BULK (surplus), CUT (deficit), MAINTAIN, or ATHLETIC
- Macro breakdown (protein/carbs/fat) - critical for nutrition recommendations

RETURNS: { dailyCalorieGoal, goalType, proteinGoal, carbsGoal, fatGoal }`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_readiness_data',
    description: `Get user's recovery and readiness data. MUST call this BEFORE any training recommendation, workout creation, or when user asks "should I train today?", "how hard should I go?", "am I recovered?".
    
CONTEXT TO CONSIDER:
- HRV (Heart Rate Variability) - higher = better recovered
- Sleep score and hours
- Fatigue level (LOW/MODERATE/HIGH)
- Readiness score - use this to determine workout intensity
- If readiness is LOW or fatigue is HIGH: recommend light workout, active recovery, or rest

RETURNS: Array of { date, readinessScore, hrv, sleepHours, fatigue } for past X days`,
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of history (default: 7, max: 30)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_today_nutrition',
    description: `Get user's logged meals for today. Call this when user asks about:
- "What have I eaten today?"
- "How many calories did I eat?"
- "What's my nutrition progress?"
- Before creating meal plan to see what's already consumed

CONTEXT TO CONSIDER:
- Total calories eaten vs goal
- Macros consumed vs targets
- Meals already logged (to avoid duplicates in meal plans)
- Timing of meals (breakfast, lunch, dinner, snacks)

RETURNS: { meals: [{ name, calories, protein, carbs, fat, time }], totals: { calories, protein, carbs, fat } }`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_meal_plan',
    description: `Get user's AI-generated meal plan for today. Call this when user asks about:
- "What's my meal plan?"
- "What should I eat?"
- "Show me today's meals"

CONTEXT TO CONSIDER:
- The meal plan was created based on user's goals
- Shows what the AI recommended for each meal
- May show completion status if user logged meals

RETURNS: Today's meal plan with meals, timing, and completion status`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'log_water',
    description: `Log water intake. MANDATORY - you MUST call this tool whenever the user mentions drinking water, water glasses, hydration, or any liquid water intake.
    
EXAMPLES - ALWAYS call this tool for these phrases:
- "I drank 3 glasses of water" -> amount: "750"
- "I drank 500ml of water" -> amount: "500"
- "I drank 1 liter of water" -> amount: "1000"
- "I drank a bottle" -> amount: "500"
- "I had 2 bottles of water" -> amount: "1000"
- "I drank 3 water glasses today" -> amount: "750"
- "I had some water" -> amount: "250" (default estimate)

PARSE THE AMOUNT:
- glass = 250ml
- cup = 200ml  
- bottle = 500ml
- liter/L = 1000ml
- If number given, use that many ml
- Multiply count by ml per container

IMPORTANT: This tool is for WATER only. For other beverages, do NOT call this tool.

RETURNS: { success: true, amount: number, totalToday: number }`,
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'string', description: 'Amount in ml as string. Examples: "3 glasses"->"750", "1 liter"->"1000", "500ml"->"500"' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'get_water_intake',
    description: `Get user's water intake for today. Call this when user asks about:
- "How much water have I drunk?"
- "What's my water intake?"
- "Am I hydrated?"

RETURNS: { amount: number, goal: number, percentage: number }`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_meal_plan',
    description: `Create a new AI-generated meal plan. ONLY call this when user EXPLICITLY requests a new meal plan with phrases like:

BEFORE CALLING: First call get_user_goals AND get_today_nutrition to understand:
- User's calorie/macro targets
- What's already been eaten today
- Goal type (bulk/cut/maintain) for appropriate caloric intake

CONTEXT TO CONSIDER:
- Meal timing (spread throughout day)
- Total calories should match goal
- Practical, realistic meals
- Consider any dietary restrictions if known

RETURNS: Newly created meal plan with breakfast, lunch, dinner, snacks`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_recent_workouts',
    description: `Get user's workout history from Strava and manual entries. Call this when user asks about:
- "What workouts have I done?"
- "Show me my training history"
- "When did I last workout?"
- Before creating new workout to avoid similar routines

CONTEXT TO CONSIDER:
- Most recent workout type (avoid overtraining same muscles)
- Workout frequency (how often training)
- Duration and calories from recent workouts
- Source: Strava (automatic) vs manual "Your Workouts"

RETURNS: Array of { name, date, duration, calories, type }`,
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of workouts to retrieve (default: 10, max: 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_injuries',
    description: `Get user's injury history. MANDATORY to call BEFORE creating any workout or giving exercise recommendations.
    
ALWAYS call this when:
- User asks for workout recommendations
- User says they have pain or discomfort
- Creating any exercise plan

CONTEXT TO CONSIDER:
- Active injuries: MUST avoid exercises targeting affected body parts
- Injury severity: severe = avoid all load, moderate = light only, mild = modified exercises
- Body parts affected: adjust exercises to work around injuries
- Recovery status: check if previously injured areas are healed

RETURNS: Array of { id, name, bodyPart, status, severity, notes, createdAt }`,
    parameters: {
      type: 'object',
      properties: {
        active_only: {
          type: 'boolean',
          description: 'If true, only return active injuries (recommended when generating workouts)',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_injury',
    description: `Log a new injury when user reports pain, discomfort, or injury. 
    
BEFORE CALLING: Ask the user clarifying questions to gather:
- What body part? (knee, shoulder, back, etc.)
- What happened? (specific incident or gradual onset)
- Severity: mild (can train with modifications), moderate (avoid loaded movements), severe (rest required)
- Any relevant notes

CONTEXT TO CONSIDER:
- This is for the Kinetotherapist agent primarily
- After adding, provide recovery exercises and modifications
- Consider updating workout recommendations to avoid affected area

RETURNS: Confirmation with injury details`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of injury (e.g., "Torn ACL", "Muscle strain", "Knee pain", "Shoulder impingement")',
        },
        body_part: {
          type: 'string',
          description: 'Affected body part (e.g., "Knee", "Shoulder", "Lower Back", "Hamstring")',
        },
        description: {
          type: 'string',
          description: 'Brief description of how it happened or what the user feels',
        },
        severity: {
          type: 'string',
          enum: ['mild', 'moderate', 'severe'],
          description: 'mild = can train with modifications, moderate = avoid loaded movements, severe = rest required',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about pain level, triggers, etc.',
        },
      },
      required: [],
    },
  },
  {
    name: 'mark_injury_recovered',
    description: `Mark an injury as recovered when user says:
- "I'm better"
- "The pain is gone"
- "I've recovered"
- "My [body part] is fine now"

REQUIRED: You must have the injury_id from a previous get_injuries call.

RETURNS: Confirmation that injury was marked as recovered`,
    parameters: {
      type: 'object',
      properties: {
        injury_id: {
          type: 'string',
          description: 'The ID of the injury to mark as recovered (from get_injuries response)',
        },
      },
      required: ['injury_id'],
    },
  },
  {
    name: 'get_daily_summary',
    description: `Get daily summary data for user's health metrics. Call this when user asks about:
- "How did I do today?"
- "Show me my stats"
- "How many calories did I burn?"
- "How did I sleep?"

CONTEXT TO CONSIDER:
- Calories burned from all workouts (Strava + Your Workouts)
- Steps and active minutes
- Sleep hours and quality
- HRV for recovery assessment

RETURNS: Array of { date, caloriesBurned, caloriesFromFood, steps, activeMinutes, sleepHours, sleepScore, hrv }`,
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to retrieve (default: 7, max: 30)',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_workout',
    description: `Generate and create a new workout. MANDATORY to gather context BEFORE calling:
1. Call get_user_goals FIRST - know calorie target and goal type
2. Call get_injuries with active_only=true - know what to avoid
3. Call get_readiness_data (last 3 days) - know recovery state
4. Call get_recent_workouts - know training history

CONTEXT TO CONSIDER FOR WORKOUT CREATION:
- INJURIES: If user has active injuries, MUST create easier/modified workout avoiding affected body parts
- READINESS: If readiness is LOW, recommend light workout (low reps, higher reps, less weight)
- GOALS: If bulking = more compound movements, higher volume; if cutting = maintain muscle with moderate volume
- RECENT WORKOUTS: If trained legs yesterday, don't create leg day today
- USER REQUEST: If they specify "push", "pull", "legs", "upper", "lower", "full body" - respect that

WORKOUT MODIFICATION BASED ON INJURIES:
- Knee injury: Avoid squats, lunges → use leg press, seated leg curl
- Shoulder injury: Avoid overhead press → use lateral raises, face pulls
- Back injury: Avoid deadlifts → use lat pulldowns, rows
- Reduce sets/reps for moderate injuries
- Suggest mobility work for mild injuries

RETURNS: Generated workout with exercises, sets, reps, rest - AUTO-SAVED to user's library`,
    parameters: {
      type: 'object',
      properties: {
        split_type: {
          type: 'string',
          enum: ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'ppl'],
          description: 'Workout type: push (chest/shoulders/triceps), pull (back/biceps), legs, upper, lower, full_body, or ppl',
        },
        muscle_focus: {
          type: 'string',
          description: 'Specific muscle group to focus on (e.g., "chest", "back", "legs")',
        },
        num_exercises: {
          type: 'string',
          description: 'Number of exercises (default: 6)',
        },
      },
      required: [],
    },
  },
  {
    name: 'save_workout',
    description: `Save a manually defined workout to user's library. Only use this if user provides custom exercises that weren't generated by generate_workout.
    
NOTE: generate_workout already auto-saves, so this is rarely needed.

RETURNS: Confirmation that workout was saved`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the workout (e.g., "Push Day", "Leg Day", "Upper Body")',
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Exercise name' },
              sets: { type: 'number', description: 'Number of sets' },
              reps: { type: 'string', description: 'Rep range (e.g., "8-12")' },
              rest_seconds: { type: 'number', description: 'Rest between sets in seconds' },
            },
          },
          description: 'Array of exercises with name, sets, reps, rest',
        },
      },
      required: ['name', 'exercises'],
    },
  },
  {
    name: 'get_workouts',
    description: `Get user's saved workout library. Call this when user asks to:
- "Show my workouts"
- "What workouts do I have?"
- "Start a workout"

CONTEXT TO CONSIDER:
- Shows all workouts user has saved
- Includes the AI-generated workouts (from generate_workout)
- User can start any of these workouts

RETURNS: Array of { _id, name, exercises: [{ id, exerciseName, sets, reps, restSeconds }] }`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map(t => t.name);
