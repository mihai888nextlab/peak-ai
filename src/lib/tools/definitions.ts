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
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map(t => t.name);
