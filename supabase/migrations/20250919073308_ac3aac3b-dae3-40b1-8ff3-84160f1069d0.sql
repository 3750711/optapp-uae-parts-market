-- Create function to estimate TG views with gradual daily growth
CREATE OR REPLACE FUNCTION public.estimate_tg_views(p_id uuid, p_created_at timestamptz)
RETURNS int
LANGUAGE sql
STABLE
AS $$
WITH params AS (
  SELECT
    date_trunc('day', now())::date                AS today,
    date_trunc('day', p_created_at)::date         AS d0,

    -- Personal "cap" 880..990 (NEVER 1000), deterministically from p_id:
    (880 + (abs(hashtextextended(p_id::text || ':cap', 0)) % 111))::int AS cap,

    -- Ranges:
    120::int AS day0_min,
    300::int AS day0_max,
    20::int  AS inc_min,
    150::int AS inc_max,

    -- Intra-day breakdown: 96 slots of 15 minutes
    96::int  AS slots,

    -- Current slot number (0..95) from midnight:
    floor(extract(epoch from (now() - date_trunc('day', now()))) / (15*60))::int AS slot_idx
),
-- How many full days have passed
span AS (
  SELECT greatest(0, (SELECT today - d0 FROM params))::int AS days_passed
),
-- Day by day: 0..days_passed (last one is "today")
days AS (
  SELECT generate_series(0, (SELECT days_passed FROM span))::int AS day_idx
),
-- Stable "random" based on p_id + day_idx → daily increment
rng_day AS (
  SELECT
    d.day_idx,
    abs(hashtextextended((p_id::text || '-' || d.day_idx), 0))::bigint AS h
  FROM days d
),
inc_by_day AS (
  SELECT
    r.day_idx,
    CASE WHEN r.day_idx = 0
      THEN ((r.h % ((SELECT day0_max - day0_min + 1 FROM params))) + (SELECT day0_min FROM params))::int
      ELSE ((r.h % ((SELECT inc_max - inc_min + 1 FROM params))) + (SELECT inc_min FROM params))::int
    END AS inc
  FROM rng_day r
),
-- Sum for previous full days (without today)
sum_prev_days AS (
  SELECT coalesce(sum(inc), 0)::int AS prev_sum
  FROM inc_by_day
  WHERE day_idx < (SELECT days_passed FROM span)
),
-- Today's increment
today_inc AS (
  SELECT inc
  FROM inc_by_day
  WHERE day_idx = (SELECT days_passed FROM span)
),
-- Intra-day slots with "weights", so growth is uneven but monotonic
slots AS (
  SELECT generate_series(0, (SELECT slots FROM params)-1)::int AS sidx
),
slot_weights AS (
  SELECT
    s.sidx,
    -- Weight 1..5, deterministically from p_id + today + sidx
    (1 + (abs(hashtextextended(p_id::text || ':' || (SELECT today FROM params)::text || ':' || s.sidx::text, 0)) % 5))::int AS w
  FROM slots s
),
slot_aggr AS (
  SELECT
    (SELECT coalesce(sum(w),0) FROM slot_weights) AS w_total,
    (SELECT coalesce(sum(w),0) FROM slot_weights WHERE sidx <= least((SELECT slot_idx FROM params), (SELECT slots FROM params)-1)) AS w_done
),
-- Fraction of today's increment that has already "accumulated" by current slot:
today_partial AS (
  SELECT
    floor( coalesce((SELECT inc FROM today_inc), 0) * 
           CASE WHEN (SELECT w_total FROM slot_aggr) > 0
                THEN (SELECT w_done FROM slot_aggr)::numeric / (SELECT w_total FROM slot_aggr)
                ELSE 1 END
         )::int AS partial_inc
),
-- Total before cap limitation
total_raw AS (
  SELECT (SELECT prev_sum FROM sum_prev_days) + (SELECT partial_inc FROM today_partial) AS est
)
SELECT least((SELECT cap FROM params), (SELECT est FROM total_raw));
$$;

-- Create view for easy access
CREATE OR REPLACE VIEW public.products_with_view_estimate AS
SELECT
  p.*,
  public.estimate_tg_views(p.id, p.created_at) AS tg_views_estimate
FROM public.products p;

-- RLS policy for the view - only sellers and admins can access tg_views_estimate
CREATE POLICY "Sellers and admins can view estimate data" ON public.products_with_view_estimate
FOR SELECT USING (
  is_current_user_admin() OR 
  (seller_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  ))
);