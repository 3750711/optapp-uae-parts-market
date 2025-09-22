-- Step 1: Fix RLS policies for AI learning system

-- Allow service role to manage ai_translation_rules
CREATE POLICY "Service role can manage translation rules" ON public.ai_translation_rules
FOR ALL USING (
  current_setting('role') = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
)
WITH CHECK (
  current_setting('role') = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Allow service role to insert into ai_correction_analysis  
CREATE POLICY "Service role can insert correction analysis" ON public.ai_correction_analysis
FOR INSERT WITH CHECK (
  current_setting('role') = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- Allow service role to read ai_moderation_corrections for learning
CREATE POLICY "Service role can read moderation corrections" ON public.ai_moderation_corrections
FOR SELECT USING (
  current_setting('role') = 'service_role' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
);