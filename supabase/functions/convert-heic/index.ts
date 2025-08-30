import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎯 HEIC Edge Function: Starting HEIC conversion request')
    
    const { fileData, fileName, quality = 0.82, maxSide = 1600 } = await req.json()
    
    if (!fileData || !fileName) {
      throw new Error('Missing required fields: fileData and fileName')
    }

    console.log('📝 HEIC Edge Function: Processing file', {
      fileName,
      quality,
      maxSide,
      dataSize: fileData.length
    })

    // Convert base64 to Uint8Array
    const binaryString = atob(fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log('🔄 HEIC Edge Function: Converted base64 to binary, size:', bytes.length)

    // Use ImageMagick to convert HEIC to JPEG
    const convertCommand = [
      'magick',
      '-', // Read from stdin
      '-format', 'jpeg',
      '-quality', Math.round(quality * 100).toString(),
      '-resize', `${maxSide}x${maxSide}>`, // Only resize if larger
      '-strip', // Remove metadata
      'jpeg:-' // Output to stdout
    ]

    console.log('⚡ HEIC Edge Function: Running ImageMagick conversion...')
    
    const process = new Deno.Command('magick', {
      args: convertCommand.slice(1), // Remove 'magick' from args
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped'
    })

    const child = process.spawn()
    
    // Write input data
    const writer = child.stdin.getWriter()
    await writer.write(bytes)
    await writer.close()

    // Wait for conversion to complete
    const { code, stdout, stderr } = await child.output()

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr)
      console.error('❌ HEIC Edge Function: ImageMagick failed:', errorText)
      throw new Error(`ImageMagick conversion failed: ${errorText}`)
    }

    console.log('✅ HEIC Edge Function: ImageMagick conversion successful')

    // Convert output to base64
    const outputBase64 = btoa(String.fromCharCode(...stdout))
    
    // Create a new filename with .jpg extension
    const outputFileName = fileName.replace(/\.(heic|heif)$/i, '.jpg')

    console.log('🎉 HEIC Edge Function: Conversion completed', {
      originalSize: bytes.length,
      convertedSize: stdout.length,
      compressionRatio: `${Math.round((1 - stdout.length / bytes.length) * 100)}%`,
      outputFileName
    })

    return new Response(JSON.stringify({
      success: true,
      data: outputBase64,
      fileName: outputFileName,
      originalSize: bytes.length,
      convertedSize: stdout.length,
      mimeType: 'image/jpeg'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    })

  } catch (error) {
    console.error('💥 HEIC Edge Function: Error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'HEIC conversion failed'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    })
  }
})