import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/jpeg;base64,${image}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: `Analyze this food image and estimate the nutritional information. 
                
Return ONLY a JSON object with this exact structure (no other text):
{
  "foodName": "brief description of the food",
  "calories": "estimated calories",
  "protein": "protein in grams", 
  "carbs": "carbs in grams",
  "fat": "fat in grams",
  "servingSize": "estimated serving size",
  "confidence": "your confidence level 0-100%"
}

Be as accurate as possible based on portion size, cooking method, and ingredients visible.`
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Groq API error: ${response.status} - ${errorText.substring(0, 100)}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data).substring(0, 500));
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    let nutrition;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutrition = JSON.parse(jsonMatch[0]);
      } else {
        const lines = content.split('\n');
        const result: Record<string, string> = {};
        for (const line of lines) {
          const match = line.match(/"(\w+)":\s*"?([^",}]+)"?/);
          if (match) {
            result[match[1]] = match[2].trim();
          }
        }
        if (Object.keys(result).length > 0) {
          nutrition = result;
        }
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
    }

    if (nutrition) {
      return NextResponse.json({
        foodName: nutrition.foodName || 'Analyzed Food',
        calories: parseInt(nutrition.calories) || parseInt(nutrition.calories?.toString()) || 0,
        protein: parseInt(nutrition.protein) || parseInt(nutrition.protein?.toString()) || 0,
        carbs: parseInt(nutrition.carbs) || parseInt(nutrition.carbs?.toString()) || 0,
        fat: parseInt(nutrition.fat) || parseInt(nutrition.fat?.toString()) || 0,
        servingSize: nutrition.servingSize || '1 serving',
        confidence: nutrition.confidence || '80%',
      });
    }
    
    return NextResponse.json(
      { error: 'Could not parse AI response: ' + content.substring(0, 200) },
      { status: 500 }
    );
  } catch (error) {
    console.error('Food analysis error:', error);
    return NextResponse.json(
      { error: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
