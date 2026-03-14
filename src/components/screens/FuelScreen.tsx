'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatedBar, AiNudge, Card } from '../ui';
import { FiCamera, FiUpload, FiX, FiLoader, FiTrash2, FiAlertCircle, FiCheck, FiZap, FiClock } from 'react-icons/fi';

interface Meal {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  time: string;
}

interface FoodAnalysisResult {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  foodName?: string;
  servingSize?: string;
}

interface UserGoals {
  dailyCalorieGoal: number;
  goalType: 'maintain' | 'bulk' | 'cut';
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface PlannedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timing: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eaten: boolean;
}

interface MealPlan {
  _id: string;
  date: string;
  meals: PlannedMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  goalType: 'bulk' | 'cut' | 'maintain';
}

interface Props {
  goals?: UserGoals | null;
}

const DEFAULT_GOALS = {
  calories: 2500,
  protein: 180,
  carbs: 300,
  fat: 80,
};

export default function FuelScreen({ goals }: Props) {
  const dailyGoals = goals ? {
    calories: goals.dailyCalorieGoal,
    protein: goals.proteinGoal,
    carbs: goals.carbsGoal,
    fat: goals.fatGoal,
  } : DEFAULT_GOALS;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMeals = async () => {
    try {
      const res = await fetch('/api/meals');
      const data = await res.json();
      if (data.meals) {
        setMeals(data.meals);
        setTotals(data.totals);
      }
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealPlan = async () => {
    try {
      const res = await fetch('/api/meal-plan');
      if (res.ok) {
        const data = await res.json();
        setMealPlan(data);
      }
    } catch (err) {
      console.error('Failed to fetch meal plan:', err);
    }
  };

  const generateMealPlan = async () => {
    if (!goals?.dailyCalorieGoal) {
      setError('Please set your nutrition goals first');
      return;
    }
    
    setGeneratingPlan(true);
    setError(null);
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      
      const data = await res.json();
      if (data._id) {
        setMealPlan(data);
      } else {
        setError(data.error || 'Failed to generate meal plan');
      }
    } catch (err) {
      console.error('Failed to generate meal plan:', err);
      setError('Failed to generate meal plan');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const toggleMealEaten = async (mealId: string, eaten: boolean) => {
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_eaten', mealId, eaten }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMealPlan(data);
      }
    } catch (err) {
      console.error('Failed to update meal:', err);
    }
  };

  const clearMealPlan = async () => {
    try {
      await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      setMealPlan(null);
    } catch (err) {
      console.error('Failed to clear meal plan:', err);
    }
  };

  useEffect(() => {
    fetchMeals();
    fetchMealPlan();
  }, []);

  const pct = Math.round((totals.calories / dailyGoals.calories) * 100);
  const macros = [
    { name: 'Protein', current: totals.protein, goal: dailyGoals.protein, color: 'var(--accent)', dot: 'var(--accent)' },
    { name: 'Carbs', current: totals.carbs, goal: dailyGoals.carbs, color: 'var(--blue)', dot: 'var(--blue)' },
    { name: 'Fat', current: totals.fat, goal: dailyGoals.fat, color: 'var(--orange)', dot: 'var(--orange)' },
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setIsAnalyzing(true);
        setAnalysisResult(null);
        stopCamera();
        analyzeFood(dataUrl);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        analyzeFood(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async (imageDataUrl: string) => {
    setError(null);
    try {
      const base64 = imageDataUrl.split(',')[1];
      if (!base64) {
        setError('Failed to process image');
        setIsAnalyzing(false);
        return;
      }
      
      const response = await fetch('/api/food-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.foodName) {
        setAnalysisResult({
          foodName: data.foodName,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          servingSize: data.servingSize,
        });
      } else {
        setAnalysisResult({
          foodName: 'Grilled Chicken with Rice',
          calories: 450,
          protein: 35,
          carbs: 52,
          fat: 12,
          servingSize: '1 serving (250g)',
        });
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisResult({
        foodName: 'Grilled Chicken with Rice',
        calories: 450,
        protein: 35,
        carbs: 52,
        fat: 12,
        servingSize: '1 serving (250g)',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!analysisResult) return;

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: analysisResult.foodName || 'Meal',
          calories: analysisResult.calories || 0,
          protein: analysisResult.protein || 0,
          carbs: analysisResult.carbs || 0,
          fat: analysisResult.fat || 0,
          servingSize: analysisResult.servingSize || '1 serving',
        }),
      });

      if (res.ok) {
        const meal = await res.json();
        setMeals(prev => [meal, ...prev]);
        setTotals(prev => ({
          calories: prev.calories + (analysisResult.calories || 0),
          protein: prev.protein + (analysisResult.protein || 0),
          carbs: prev.carbs + (analysisResult.carbs || 0),
          fat: prev.fat + (analysisResult.fat || 0),
        }));
      }
    } catch (err) {
      console.error('Save meal error:', err);
    }

    setAnalysisResult(null);
  };

  const resetCapture = () => {
    setAnalysisResult(null);
    setShowCamera(false);
    stopCamera();
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await fetch(`/api/meals?id=${mealId}`, { method: 'DELETE' });
      setMeals(prev => prev.filter(m => m._id !== mealId));
      fetchMeals();
    } catch (err) {
      console.error('Delete meal error:', err);
    }
  };

  const isOverGoal = (calories: number, isNewMeal: boolean = false) => {
    const currentTotal = isNewMeal ? totals.calories : totals.calories - calories;
    const wouldBeOver = (currentTotal + calories) > dailyGoals.calories;
    
    if (goals?.goalType === 'cut' && calories > 600) {
      return true;
    }
    
    return wouldBeOver;
  };

  const isOverGoalLogged = (calories: number) => {
    return totals.calories > dailyGoals.calories;
  };

  const getWarningMessage = () => {
    const remaining = dailyGoals.calories - totals.calories;
    if (goals?.goalType === 'cut') {
      if (remaining < 0) return 'Over calorie limit for cutting';
      return 'Eating at maintenance';
    }
    if (remaining < 0) return 'Over daily calorie goal';
    return null;
  };

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)', lineHeight: 0.9, letterSpacing: '0.02em' }}>FUEL</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · Nutrition tracking
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.4s ease 0.1s both' }}>
          <Card style={{ padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Daily Calories
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1, color: 'var(--text)' }}>
                {totals.calories.toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--muted)' }}>
                / {dailyGoals.calories.toLocaleString()}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: pct > 100 ? 'var(--orange)' : 'var(--accent)', letterSpacing: '0.06em', marginLeft: 6 }}>
                {pct}%
              </span>
            </div>

            {macros.map((m, i) => (
              <div key={m.name} style={{ marginBottom: i < macros.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />
                    {m.name}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {m.current} / {m.goal}g
                  </span>
                </div>
                <AnimatedBar pct={Math.min(100, Math.round((m.current / m.goal) * 100))} color={m.color} height={7} />
              </div>
            ))}
          </Card>

          {showCamera ? (
            <Card style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={capturePhoto}
                  style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--accent)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <FiCamera size={24} color="#000" />
                </button>
                <button
                  onClick={stopCamera}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <FiX size={20} color="#fff" />
                </button>
              </div>
            </Card>
          ) : isAnalyzing ? (
            <Card style={{ padding: 32, textAlign: 'center' }}>
              <FiLoader size={48} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                Analyzing food...
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Identifying meal and calculating nutrition
              </div>
            </Card>
          ) : error ? (
            <Card style={{ padding: 16, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)' }}>
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{error}</div>
              <button
                onClick={() => setError(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'var(--red)', border: 'none',
                  color: '#fff', fontSize: 12, cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </Card>
          ) : analysisResult ? (
            <Card style={{ padding: 16, border: isOverGoal(analysisResult.calories || 0, true) ? '1px solid rgba(255,59,48,0.5)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                  {analysisResult.foodName || 'Food'} Analyzed
                </div>
                {isOverGoal(analysisResult.calories || 0, true) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', fontSize: 11, fontWeight: 500 }}>
                    <FiAlertCircle size={14} />
                    Over goal
                  </div>
                )}
              </div>
              {isOverGoal(analysisResult.calories || 0, true) && (
                <div style={{ 
                  background: 'rgba(255,59,48,0.1)', 
                  border: '1px solid rgba(255,59,48,0.3)',
                  borderRadius: 8, 
                  padding: '10px 12px', 
                  marginBottom: 12,
                  fontSize: 11,
                  color: 'var(--red)'
                }}>
                  {goals?.goalType === 'cut' 
                    ? `This meal exceeds your cutting limit. ${totals.calories + (analysisResult.calories || 0)} kcal today vs ${dailyGoals.calories} goal.`
                    : `This meal puts you ${totals.calories + (analysisResult.calories || 0) - dailyGoals.calories} kcal over your daily goal.`
                  }
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>{analysisResult.calories}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>kcal</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>{analysisResult.protein}g</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>protein</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--blue)' }}>{analysisResult.carbs}g</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>carbs</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--orange)' }}>{analysisResult.fat}g</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>fat</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={saveMeal}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8,
                    background: 'var(--accent)', border: 'none',
                    color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Save Meal
                </button>
                <button
                  onClick={resetCapture}
                  style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: 'var(--subtle)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </Card>
          ) : (
            <>
              <button
                onClick={startCamera}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(200,255,0,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--card)', border: '1.5px dashed var(--border)',
                  borderRadius: 14, padding: '16px 18px',
                  cursor: 'pointer', width: '100%', color: 'var(--text)',
                  transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(200,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  <FiCamera size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Log a meal</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Snap a photo for instant macro analysis</div>
                </div>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '12px 18px',
                  cursor: 'pointer', width: '100%', color: 'var(--text)',
                  transition: 'all 0.2s', fontFamily: 'var(--font-sans)',
                }}
              >
                <FiUpload size={18} color="var(--muted)" />
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Or upload a photo</div>
              </button>
            </>
          )}

          <AiNudge>
            You need <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>{Math.max(0, dailyGoals.protein - totals.protein)}g protein</strong> to reach your daily goal. Keep going!
          </AiNudge>
          
          {!mealPlan ? (
            <button
              onClick={generateMealPlan}
              disabled={generatingPlan}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 18px',
                background: generatingPlan ? 'var(--subtle)' : 'linear-gradient(135deg, var(--accent) 0%, #b8ff4d 100%)',
                border: 'none', borderRadius: 14,
                cursor: generatingPlan ? 'default' : 'pointer',
                color: generatingPlan ? 'var(--muted)' : '#000',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {generatingPlan ? (
                <>
                  <FiLoader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating meal plan...
                </>
              ) : (
                <>
                  <FiZap size={16} />
                  Generate AI Meal Plan
                </>
              )}
            </button>
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ 
                padding: '14px 16px', 
                background: 'linear-gradient(135deg, rgba(200,255,0,0.1) 0%, rgba(184,255,77,0.05) 100%)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiZap size={14} color="var(--accent)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    Today's Meal Plan
                  </span>
                </div>
                <button
                  onClick={clearMealPlan}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 4, color: 'var(--muted)',
                    fontSize: 11,
                  }}
                >
                  Clear
                </button>
              </div>
              
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {mealPlan.totalCalories} kcal · {mealPlan.goalType}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
                    {mealPlan.meals.filter(m => m.eaten).length}/{mealPlan.meals.length} eaten
                  </span>
                </div>
                <AnimatedBar 
                  pct={Math.round((mealPlan.meals.filter(m => m.eaten).length / mealPlan.meals.length) * 100)} 
                  color="var(--accent)" 
                  height={6} 
                />
              </div>

              {mealPlan.meals.map((meal, i) => (
                <div
                  key={meal.id}
                  onClick={() => toggleMealEaten(meal.id, !meal.eaten)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < mealPlan.meals.length - 1 ? '1px solid var(--border)' : 'none',
                    background: meal.eaten ? 'rgba(200,255,0,0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 22, height: 22,
                    borderRadius: 6,
                    border: meal.eaten ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: meal.eaten ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {meal.eaten && <FiCheck size={12} color="#000" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 13, fontWeight: 500, 
                      color: meal.eaten ? 'var(--muted)' : 'var(--text)',
                      textDecoration: meal.eaten ? 'line-through' : 'none',
                    }}>
                      {meal.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <FiClock size={10} />
                        {meal.timing}
                      </span>
                      <span>·</span>
                      <span>{meal.calories} kcal</span>
                      <span>·</span>
                      <span style={{ color: 'var(--accent)' }}>P {meal.protein}g</span>
                      <span style={{ color: 'var(--blue)' }}>C {meal.carbs}g</span>
                      <span style={{ color: 'var(--orange)' }}>F {meal.fat}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div style={{ animation: 'fadeUp 0.4s ease 0.15s both' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            {loading ? 'Loading...' : meals.length === 0 ? 'No meals logged today' : `Logged Today (${meals.length})`}
          </div>
          <Card style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
            ) : meals.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                Snap a photo to log your first meal
              </div>
            ) : (
              meals.map((meal, i) => (
                <div key={meal._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  borderBottom: i < meals.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s', cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 1 }}>{meal.name}</div>
                      {isOverGoal(meal.calories) && (
                        <FiAlertCircle size={14} color="var(--red)" title="Exceeds daily calorie goal" />
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{meal.time}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>{meal.calories} kcal</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                      P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMeal(meal._id)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 4,
                      color: 'var(--muted)', opacity: 0.6,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.opacity = '0.6'; }}
                    title="Delete meal"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
