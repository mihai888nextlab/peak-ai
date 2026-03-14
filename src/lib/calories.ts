import { chatCompletion } from './groq';

const CALORIES_PROMPT = `You are a fitness expert. Estimate calories burned for this workout.

Activity type: {type}
Duration: {duration} seconds ({durationMinutes} minutes)
Distance: {distance} meters ({distanceKm} km)
Elevation gain: {elevation} meters
Average speed: {avgSpeed} m/s ({speedKmh} km/h)

Consider:
- Different activities burn different calories per minute
- Weight assumption: 75kg male (average)
- Include basal metabolic rate contribution

Respond with just a number (calories burned). No explanation needed.`;

const MET_VALUES: Record<string, number> = {
  'Run': 9.8,
  'Ride': 8.0,
  'Swim': 7.0,
  'Walk': 3.5,
  'Hike': 6.0,
  'WeightTraining': 5.0,
  'Yoga': 3.0,
  'CrossFit': 8.0,
  'Rowing': 7.0,
  'Elliptical': 5.0,
  'StairStepper': 9.0,
  'RockClimbing': 8.0,
  'Workout': 5.0,
  'default': 5.0,
};

export function estimateCaloriesBasic(
  durationSeconds: number,
  distanceMeters: number,
  elevationMeters: number,
  activityType: string
): number {
  const durationMinutes = durationSeconds / 60;
  const weightKg = 75;
  
  const met = MET_VALUES[activityType] || MET_VALUES['default'];
  
  const baseCalories = met * weightKg * (durationMinutes / 60);
  
  const distanceKm = distanceMeters / 1000;
  let activityCalories = 0;
  
  if (distanceKm > 0 && activityType === 'Run') {
    activityCalories = distanceKm * (weightKg * 1.036);
  } else if (distanceKm > 0 && activityType === 'Ride') {
    activityCalories = distanceKm * (weightKg * 0.5);
  }
  
  const elevationCalories = elevationMeters * (weightKg * 0.02);
  
  return Math.round(baseCalories + activityCalories + elevationCalories);
}

export async function estimateCaloriesWithAI(
  durationSeconds: number,
  distanceMeters: number,
  elevationMeters: number,
  avgSpeed: number,
  activityType: string
): Promise<number> {
  const durationMinutes = Math.round(durationSeconds / 60);
  const distanceKm = (distanceMeters / 1000).toFixed(2);
  const speedKmh = (avgSpeed * 3.6).toFixed(1);
  
  const prompt = CALORIES_PROMPT
    .replace('{type}', activityType)
    .replace('{duration}', String(durationSeconds))
    .replace('{durationMinutes}', String(durationMinutes))
    .replace('{distance}', String(distanceMeters))
    .replace('{distanceKm}', distanceKm)
    .replace('{elevation}', String(elevationMeters))
    .replace('{avgSpeed}', String(avgSpeed))
    .replace('{speedKmh}', speedKmh);
  
  try {
    const response = await chatCompletion([{ role: 'user', content: prompt }], {
      temperature: 0.3,
      maxTokens: 10,
    });
    
    const calories = parseInt(response.replace(/[^0-9]/g, ''));
    
    if (calories > 0 && calories < 10000) {
      return calories;
    }
  } catch (error) {
    console.error('Failed to estimate calories with AI:', error);
  }
  
  return estimateCaloriesBasic(durationSeconds, distanceMeters, elevationMeters, activityType);
}
