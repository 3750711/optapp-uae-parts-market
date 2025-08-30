// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    console.log('🎯 HEIC Edge Function: Starting HEIC conversion request');
    
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const maxSideRaw = form.get("maxSide");
    if (!file) return new Response("file is required", { status: 400, headers: CORS });

    const maxSide = Number(maxSideRaw) || 1600;
    const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
    const preset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET")!;

    console.log('📝 HEIC Edge Function: Processing file', {
      fileName: file.name,
      maxSide,
      fileSize: file.size,
      cloud,
      preset
    });

    // Проксируем загрузку в Cloudinary, просим EAGER-трансформацию
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    fd.append("folder", "products");
    // сгенерированный JPEG уменьшенного размера:
    fd.append("eager", `c_limit,w_${maxSide}/f_jpg,q_auto:good`);

    console.log('🔄 HEIC Edge Function: Proxying to Cloudinary with eager transformation');
    
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { 
      method: "POST", 
      body: fd 
    });
    
    const text = await r.text();
    
    console.log('✅ HEIC Edge Function: Cloudinary response status:', r.status);

    return new Response(text, { 
      status: r.status, 
      headers: { 
        ...CORS, 
        "Content-Type": "application/json" 
      } 
    });
    
  } catch (e) {
    console.error('💥 HEIC Edge Function: Error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500, 
      headers: { 
        ...CORS, 
        "Content-Type": "application/json" 
      } 
    });
  }
});