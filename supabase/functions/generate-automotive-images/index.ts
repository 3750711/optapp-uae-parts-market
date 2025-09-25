
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const automotivePrompts = {
  hero: "Ultra high resolution luxury automotive parts showcase, premium car engine components, gleaming chrome finish, professional studio lighting, 16:9 aspect ratio, sophisticated automotive design, metallic textures",
  logo: "Professional automotive logo design with text 'PartsBay.ae', sleek car silhouette, premium metallic finish, clean typography, automotive industry aesthetic, high contrast",
  engine: "Ultra high resolution premium car engine parts, precision engineered components, chrome and carbon fiber details, professional automotive photography, modern luxury vehicle engine",
  brakes: "High-end brake system components, carbon ceramic brake discs, premium calipers, automotive engineering excellence, metallic finish, professional studio photography",
  wheels: "Luxury car wheels and rims, premium alloy wheels, sophisticated automotive design, chrome finish, high-end automotive components, professional photography",
  interior: "Premium automotive interior components, luxury car dashboard, high-end leather and carbon fiber materials, sophisticated automotive craftsmanship",
  abstract: "Abstract automotive background elements, flowing car silhouettes, metallic gradients, automotive industry aesthetics, modern premium design elements",
  used_parts: "Professional used automotive parts photography, high-quality second-hand car components, detailed texture showing realistic wear patterns, clean organized marketplace display, commercial automotive photography, realistic lighting, professional product photography, well-maintained condition",
  used_engine: "Professional used car engine parts photography, second-hand engine components, realistic wear patterns, clean condition, automotive marketplace display, detailed metallic surfaces, commercial lighting",
  used_transmission: "Professional used transmission parts photography, gearbox components, second-hand automotive transmission, realistic condition, marketplace product display, professional automotive photography",
  used_suspension: "Professional used suspension parts photography, shock absorbers and springs, second-hand automotive suspension components, realistic wear, clean display, professional lighting",
  used_electrical: "Professional used automotive electrical parts photography, alternators, starters, electrical components, second-hand condition, clean marketplace display, professional product photography"
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type = "hero", customPrompt } = await req.json()
    
    // Use custom prompt if provided, otherwise use predefined automotive prompts
    const prompt = customPrompt || (automotivePrompts[type as keyof typeof automotivePrompts]) || automotivePrompts.hero
    
    console.log(`Generating automotive image for type: ${type}`)
    console.log(`Using prompt: ${prompt}`)

    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))

    const image = await hf.textToImage({
      inputs: prompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    })

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    return new Response(
      JSON.stringify({ 
        image: `data:image/png;base64,${base64}`,
        type,
        prompt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating automotive image:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate automotive image', details: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
