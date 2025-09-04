import { buildCorsHeaders } from "./cors.ts";
import { HttpError, UnprocessableEntity } from "./errors.ts";

type Handler = (req: Request, ctx: { reqId: string, cors: HeadersInit }) => Promise<Response> | Response;

export function handleWithCors(handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const reqId = crypto.randomUUID();
    const cors = buildCorsHeaders(req.headers.get("Origin") ?? "*");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const t0 = Date.now();
    try {
      const res = await handler(req, { reqId, cors });
      // гарантируем CORS в ответе
      const h = new Headers(res.headers);
      for (const [k, v] of Object.entries(cors)) h.set(k, v as string);
      const out = new Response(res.body, { status: res.status, headers: h });
      console.info(JSON.stringify({ 
        level: "info", 
        reqId, 
        method: req.method, 
        url: new URL(req.url).pathname, 
        status: out.status, 
        dur: Date.now() - t0 
      }));
      return out;
    } catch (err) {
      let http: HttpError;
      if (err instanceof HttpError) {
        http = err;
      } else {
        http = new UnprocessableEntity("unhandled_error", err instanceof Error ? err.message : String(err));
      }

      const body = { error: { code: http.code, message: http.message, reqId } };
      console.error(JSON.stringify({ 
        level: "error", 
        reqId, 
        err: err instanceof Error ? err.stack ?? err.message : String(err) 
      }));
      const headers = new Headers({ "content-type": "application/json", ...cors });
      return new Response(JSON.stringify(body), { status: http.status, headers });
    }
  };
}