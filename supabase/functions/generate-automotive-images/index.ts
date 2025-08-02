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
  abstract: "Abstract automotive background elements, flowing car silhouettes, metallic gradients, automotive industry aesthetics, modern premium design elements"
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type = "hero", customPrompt } = await req.json()
    
    // Use custom prompt if provided, otherwise use predefined automotive prompts
    const prompt = customPrompt || automotivePrompts[type] || automotivePrompts.hero
    
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
      JSON.stringify({ error: 'Failed to generate automotive image', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})