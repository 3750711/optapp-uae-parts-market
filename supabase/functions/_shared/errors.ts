export class HttpError extends Error { 
  constructor(public status: number, public code: string, msg: string) { 
    super(msg); 
  } 
}

export class BadRequestError extends HttpError { 
  constructor(code = "bad_request", msg = "Bad request") { 
    super(400, code, msg);
  } 
}

export class AuthError extends HttpError { 
  constructor(code = "unauthorized", msg = "Unauthorized") { 
    super(401, code, msg);
  } 
}

export class PayloadTooLarge extends HttpError { 
  constructor(code = "payload_too_large", msg = "Payload too large") { 
    super(413, code, msg);
  } 
}

export class UnsupportedMediaType extends HttpError { 
  constructor(code = "unsupported_media_type", msg = "Unsupported media type") { 
    super(415, code, msg);
  } 
}

export class UnprocessableEntity extends HttpError { 
  constructor(code = "unprocessable_entity", msg = "Unprocessable entity") { 
    super(422, code, msg);
  } 
}

export class UpstreamError extends HttpError { 
  constructor(code = "upstream_error", msg = "Upstream error") { 
    super(502, code, msg);
  } 
}

export class ServiceUnavailable extends HttpError { 
  constructor(code = "service_unavailable", msg = "Service unavailable") { 
    super(503, code, msg);
  } 
}