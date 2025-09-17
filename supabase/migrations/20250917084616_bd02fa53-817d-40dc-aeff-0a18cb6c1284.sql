-- Create RPC function for generating unique OPT_ID
CREATE OR REPLACE FUNCTION public.generate_unique_opt_id()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_opt_id text;
  attempts int := 0;
  max_attempts int := 10;
BEGIN
  LOOP
    -- Generate random 4-letter OPT_ID (A-Z)
    new_opt_id := upper(
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int)
    );
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE opt_id = new_opt_id) THEN
      -- Log successful generation
      RAISE LOG 'Generated unique OPT_ID: % after % attempts', new_opt_id, attempts + 1;
      
      RETURN jsonb_build_object(
        'success', true,
        'opt_id', new_opt_id,
        'attempts', attempts + 1
      );
    END IF;
    
    attempts := attempts + 1;
    
    -- If max attempts reached, use fallback with random bytes
    IF attempts >= max_attempts THEN
      RAISE LOG 'Max attempts reached for OPT_ID generation, using fallback';
      
      -- Fallback: use first 4 chars of hex encoded random bytes
      new_opt_id := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 4));
      
      -- Ensure it starts with a letter (A-P for hex chars 0-F)
      new_opt_id := chr(65 + (get_byte(gen_random_bytes(1), 0) % 16)) || substring(new_opt_id from 2);
      
      RETURN jsonb_build_object(
        'success', true,
        'opt_id', new_opt_id,
        'attempts', attempts,
        'fallback', true
      );
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.generate_unique_opt_id() TO anon, authenticated;