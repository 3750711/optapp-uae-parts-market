
-- Harden RLS for requests and request_answers:
-- 1) Remove public read access
-- 2) Allow read access only to authenticated users (any logged-in user)

-- Requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view requests" ON public.requests;
DROP POLICY IF EXISTS "Public view requests" ON public.requests;

CREATE POLICY "Authenticated users can view requests"
  ON public.requests
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Request answers
ALTER TABLE public.request_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view request answers" ON public.request_answers;

CREATE POLICY "Authenticated users can view request answers"
  ON public.request_answers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
