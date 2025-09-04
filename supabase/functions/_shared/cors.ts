export function buildCorsHeaders(origin?: string) {
  const allowOrigin = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Expose-Headers": "content-length, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}