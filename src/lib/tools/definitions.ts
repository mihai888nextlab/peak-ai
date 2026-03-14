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
    description: `CALL THIS when user asks about their goals, target calories, macros, or goal type (bulking/cutting/maintaining).
Returns: User's daily calorie target, macro breakdown (protein/carbs/fat), and goal type.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_readiness_data',
    description: `CALL THIS BEFORE making ANY training recommendation or answering "should I train", "how hard should I go", "am I recovered" type questions.
Returns: HRV, sleep score, fatigue level, and readiness score for the past X days.`,
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of history to retrieve (default: 7)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_today_nutrition',
    description: `CALL THIS when user asks about today's eating, calories consumed, what they've eaten, or nutrition progress.
Returns: List of today's logged meals with calories, protein, carbs, fat, and totals.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_meal_plan',
    description: `CALL THIS when user asks about their meal plan, what meals they should eat, or wants to see today's planned meals.
Returns: Today's AI-generated meal plan with meals, timing, and completion status.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_meal_plan',
    description: `CALL THIS when user asks for a meal plan, food recommendations, what to eat, or wants AI to create a meal plan for them.
Returns: Newly created meal plan with breakfast, lunch, dinner, snacks.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_recent_workouts',
    description: `CALL THIS when user asks about workouts, training sessions, exercise history, or Strava data.
Returns: List of recent workouts with date, type, duration, calories, and source (Strava/manual).`,
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of workouts to retrieve (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_injuries',
    description: `CALL THIS when user asks about injuries, pain, or before giving training advice if user has existing injuries.
Returns: List of injuries with status (active/recovered), body part, severity, and notes.`,
    parameters: {
      type: 'object',
      properties: {
        active_only: {
          type: 'boolean',
          description: 'If true, only return active injuries (default: false)',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_injury',
    description: `CALL THIS after gathering injury details from the user. First ask questions to get: body part, what happened, severity. Then call this tool with whatever info you have.
Returns: Confirmation that injury was added with the details.`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the injury (e.g., "Torn ACL", "Muscle strain", "Knee pain")',
        },
        body_part: {
          type: 'string',
          description: 'Affected body part (e.g., "Knee", "Shoulder", "Back")',
        },
        description: {
          type: 'string',
          description: 'Brief description of what happened',
        },
        severity: {
          type: 'string',
          enum: ['mild', 'moderate', 'severe'],
          description: 'Injury severity',
        },
        notes: {
          type: 'string',
          description: 'Additional notes about the injury',
        },
      },
      required: [],
    },
  },
  {
    name: 'mark_injury_recovered',
    description: `CALL THIS when user says they're better, recovered, injury healed, or no longer in pain.
Returns: Confirmation that injury was marked as recovered.`,
    parameters: {
      type: 'object',
      properties: {
        injury_id: {
          type: 'string',
          description: 'The ID of the injury to mark as recovered',
        },
      },
      required: ['injury_id'],
    },
  },
  {
    name: 'get_daily_summary',
    description: `CALL THIS when user asks about their daily progress, stats, how they're doing, or wants to see summary data.
Returns: Daily summaries with calories eaten/burned, steps, active minutes, and sleep for past X days.`,
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to retrieve (default: 7)',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_workout',
    description: `CALL THIS when user wants to create a workout, asks for workout suggestions, wants a new routine, or says things like "create a workout", "give me exercises", "what should I do today", "make me a push day", "generate leg workout".
The AI will auto-select an appropriate split based on user's request. If user specifies "push", "pull", "legs", "upper", "lower", or "full body" use that. Otherwise will create a balanced workout.
Returns: Generated workout with exercise name, sets, reps, and rest time. Workout is automatically saved to user's library.`,
    parameters: {
      type: 'object',
      properties: {
        split_type: {
          type: 'string',
          enum: ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'ppl'],
          description: 'Type of workout split: push (chest/shoulders/triceps), pull (back/biceps), legs (quads/hamstrings/glutes), upper, lower, full_body, or ppl. Optional - will infer from user request.',
        },
        muscle_focus: {
          type: 'string',
          description: 'Optional specific muscle group to focus on (e.g., "chest", "back", "legs")',
        },
        num_exercises: {
          type: 'string',
          description: 'Number of exercises in the workout as a number or string (e.g., "6" or 6)',
        },
      },
      required: [],
    },
  },
  {
    name: 'save_workout',
    description: `CALL THIS after generate_workout when user wants to save the workout to their library. The user must confirm they want to save it.
Input: workout name, exercises array with sets, reps, rest.
Returns: Confirmation that workout was saved.`,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the workout (e.g., "Push Day", "Leg Day")',
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sets: { type: 'number' },
              reps: { type: 'string' },
              rest_seconds: { type: 'number' },
            },
          },
          description: 'Array of exercises with name, sets, reps, rest time',
        },
      },
      required: ['name', 'exercises'],
    },
  },
  {
    name: 'get_workouts',
    description: `CALL THIS when user asks to see their saved workouts, workout library, or wants to start a specific workout.
Returns: List of saved workouts with name and exercises.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map(t => t.name);
