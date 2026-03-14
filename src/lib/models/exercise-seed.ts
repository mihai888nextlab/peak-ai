import { getExercisesCollection, Exercise } from './workout';

const DEFAULT_EXERCISES: Omit<Exercise, '_id'>[] = [
  {
    name: 'Barbell Bench Press',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
    equipment: ['Barbell', 'Bench'],
    formCues: [
      'Keep feet flat on floor',
      'Retract shoulder blades',
      'Lower bar to mid-chest',
      'Drive feet through floor',
      'Keep wrists straight'
    ],
    instructions: [
      'Lie on bench with eyes under bar',
      'Grip bar slightly wider than shoulders',
      'Unrack and lower to chest',
      'Press up to lockout'
    ]
  },
  {
    name: 'Barbell Back Squat',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: ['Barbell', 'Squat Rack'],
    formCues: [
      'Brace core tightly',
      'Keep chest up',
      'Knees track over toes',
      'Break at hips first',
      'Drive through heels'
    ],
    instructions: [
      'Position bar on upper back',
      'Unrack and step back',
      'Descend until hip crease below knee',
      'Drive up to standing'
    ]
  },
  {
    name: 'Conventional Deadlift',
    muscleGroups: ['Back', 'Glutes', 'Hamstrings'],
    equipment: ['Barbell'],
    formCues: [
      'Keep bar close to body',
      'Flat back position',
      'Engage lats before lift',
      'Push floor away',
      'Hips and shoulders rise together'
    ],
    instructions: [
      'Stand with feet hip-width, bar over mid-foot',
      'Hinge and grip bar outside knees',
      'Keep back flat, chest up',
      'Drive through heels, extend hips and knees'
    ]
  },
  {
    name: 'Overhead Press',
    muscleGroups: ['Shoulders', 'Triceps'],
    equipment: ['Barbell'],
    formCues: [
      'Squeeze glutes',
      'Ribs down, core braced',
      'Head back, chin tucked',
      'Press straight up',
      'Lockout over mid-foot'
    ],
    instructions: [
      'Bar at shoulder height',
      'Grip slightly wider than shoulders',
      'Press bar overhead',
      'Return to shoulders with control'
    ]
  },
  {
    name: 'Barbell Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Barbell'],
    formCues: [
      'Hinge forward 45-60 degrees',
      'Keep back flat',
      'Pull to lower chest/upper abs',
      'Squeeze shoulder blades',
      'Lead with elbows'
    ],
    instructions: [
      'Hinge at hips, grip bar',
      'Keep back flat throughout',
      'Pull bar to torso',
      'Lower with control'
    ]
  },
  {
    name: 'Pull-up',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Pull-up Bar'],
    formCues: [
      'Engage lats first',
      'Pull elbows down and back',
      'Chin over bar',
      'Control descent',
      'No swinging'
    ],
    instructions: [
      'Hang with overhand grip',
      'Pull up until chin over bar',
      'Lower with control',
      'Repeat'
    ]
  },
  {
    name: 'Dumbbell Shoulder Press',
    muscleGroups: ['Shoulders', 'Triceps'],
    equipment: ['Dumbbells'],
    formCues: [
      'Core braced',
      'Slight back lean ok',
      'Full range of motion',
      'No excessive arching',
      'Control the descent'
    ],
    instructions: [
      'Sit or stand with dumbbells at shoulders',
      'Press overhead',
      'Lower to starting position'
    ]
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Bench'],
    formCues: [
      'Set bench 30-45 degrees',
      'Retract shoulder blades',
      'Lower to upper chest',
      'Don\'t flare elbows excessively',
      'Control the weight'
    ],
    instructions: [
      'Set bench to incline',
      'Press dumbbells from chest',
      'Lower with control'
    ]
  },
  {
    name: 'Romanian Deadlift',
    muscleGroups: ['Hamstrings', 'Glutes', 'Back'],
    equipment: ['Barbell'],
    formCues: [
      'Slight knee bend',
      'Hinge at hips',
      'Keep bar close',
      'Feel hamstring stretch',
      'Drive hips forward'
    ],
    instructions: [
      'Hold bar at hips',
      'Hinge forward, lowering bar',
      'Return by extending hips'
    ]
  },
  {
    name: 'Leg Press',
    muscleGroups: ['Quadriceps', 'Glutes'],
    equipment: ['Leg Press Machine'],
    formCues: [
      'Feet shoulder-width on platform',
      'Don\'t lock knees at top',
      'Lower until knees 90 degrees',
      'Keep lower back pressed to pad',
      'Control the descent'
    ],
    instructions: [
      'Sit in leg press',
      'Lower platform by bending knees',
      'Press back up'
    ]
  },
  {
    name: 'Lat Pulldown',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Lat Pulldown Machine'],
    formCues: [
      'Sit with thighs secured',
      'Lean back slightly',
      'Pull to upper chest',
      'Lead with elbows',
      'Control the return'
    ],
    instructions: [
      'Grip bar wider than shoulders',
      'Pull bar to upper chest',
      'Slowly return to start'
    ]
  },
  {
    name: 'Cable Row',
    muscleGroups: ['Back', 'Biceps'],
    equipment: ['Cable Machine'],
    formCues: [
      'Sit upright, feet on platform',
      'Pull to lower chest',
      'Squeeze shoulder blades',
      'Don\'t lean back excessively',
      'Control the weight'
    ],
    instructions: [
      'Sit at cable row station',
      'Grip handle',
      'Pull to torso',
      'Return with control'
    ]
  },
  {
    name: 'Leg Curl',
    muscleGroups: ['Hamstrings'],
    equipment: ['Leg Curl Machine'],
    formCues: [
      'Position pad on lower calves',
      'Don\'t lift hips',
      'Full contraction at top',
      'Control the return',
      'Don\'t let weight jerk you'
    ],
    instructions: [
      'Lie face down on machine',
      'Curl heels toward glutes',
      'Lower with control'
    ]
  },
  {
    name: 'Leg Extension',
    muscleGroups: ['Quadriceps'],
    equipment: ['Leg Extension Machine'],
    formCues: [
      'Position pad on lower shins',
      'Don\'t lean back',
      'Full extension at top',
      'Squeeze quads',
      'Control the descent'
    ],
    instructions: [
      'Sit on leg extension machine',
      'Extend legs fully',
      'Lower with control'
    ]
  },
  {
    name: 'Calf Raise',
    muscleGroups: ['Calves'],
    equipment: ['Calf Raise Machine'],
    formCues: [
      'Full range of motion',
      'Pause at top',
      'Stretch at bottom',
      'Don\'t bounce',
      'Heels down completely'
    ],
    instructions: [
      'Stand on calf raise machine',
      'Rise onto toes',
      'Lower heels below platform level'
    ]
  },
  {
    name: 'Dumbbell Curl',
    muscleGroups: ['Biceps'],
    equipment: ['Dumbbells'],
    formCues: [
      'Keep elbows at sides',
      'Don\'t swing',
      'Full contraction at top',
      'Control the descent',
      'Alternate or together'
    ],
    instructions: [
      'Stand with dumbbells at sides',
      'Curl weights to shoulders',
      'Lower with control'
    ]
  },
  {
    name: 'Tricep Pushdown',
    muscleGroups: ['Triceps'],
    equipment: ['Cable Machine'],
    formCues: [
      'Elbows pinned to sides',
      'Keep wrists straight',
      'Full extension at bottom',
      'Squeeze triceps',
      'Control the return'
    ],
    instructions: [
      'Grip cable attachment',
      'Push down until arms straight',
      'Return with control'
    ]
  },
  {
    name: 'Skull Crusher',
    muscleGroups: ['Triceps'],
    equipment: ['Barbell', 'Bench'],
    formCues: [
      'Keep elbows pointed up',
      'Lower to forehead',
      'Keep upper arms vertical',
      'Don\'t flare elbows',
      'Control the weight'
    ],
    instructions: [
      'Lie on bench with bar extended',
      'Lower bar to forehead',
      'Press back up'
    ]
  },
  {
    name: 'Plank',
    muscleGroups: ['Core'],
    equipment: ['Bodyweight'],
    formCues: [
      'Body in straight line',
      'Don\'t let hips sag',
      'Squeeze glutes',
      'Brace core',
      'Don\'t hold breath'
    ],
    instructions: [
      'Forearms on ground',
      'Body in straight line',
      'Hold position'
    ]
  },
  {
    name: 'Hanging Leg Raise',
    muscleGroups: ['Core'],
    equipment: ['Pull-up Bar'],
    formCues: [
      'Hang with straight arms',
      'Don\'t swing',
      'Lift legs to parallel or higher',
      'Control the descent',
      'Pelvic tilt at top'
    ],
    instructions: [
      'Hang from pull-up bar',
      'Raise legs to horizontal',
      'Lower with control'
    ]
  }
];

export async function seedExercises() {
  const collection = await getExercisesCollection();
  
  const count = await collection.countDocuments();
  if (count > 0) {
    console.log('Exercises already seeded');
    return;
  }

  await collection.insertMany(DEFAULT_EXERCISES as Exercise[]);
  console.log('Seeded', DEFAULT_EXERCISES.length, 'exercises');
}

export async function getExercises(): Promise<Omit<Exercise, '_id'>[]> {
  return DEFAULT_EXERCISES;
}

export async function getAllExercises(): Promise<Omit<Exercise, '_id'>[]> {
  const collection = await getExercisesCollection();
  const dbExercises = await collection.find({}).toArray();
  if (dbExercises.length > 0) {
    return dbExercises;
  }
  return DEFAULT_EXERCISES;
}

export async function searchExercises(query: string, muscleGroup?: string): Promise<Omit<Exercise, '_id'>[]> {
  const dbExercises = await getAllExercises();
  
  let filtered = dbExercises;
  
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(ex => ex.name.toLowerCase().includes(q));
  }
  
  if (muscleGroup) {
    const m = muscleGroup.toLowerCase();
    filtered = filtered.filter(ex => ex.muscleGroups.some(mg => mg.toLowerCase().includes(m)));
  }
  
  return filtered;
}
