-- Create a dedicated table for message history to improve tracking and performance
CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_ids UUID[] NOT NULL,
  recipient_group TEXT,
  message_text TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;

-- Create policies for message history
CREATE POLICY "Only admins can view message history" 
ON public.message_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Only admins can create message history" 
ON public.message_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Only admins can update message history" 
ON public.message_history 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_message_history_sender_id ON public.message_history(sender_id);
CREATE INDEX idx_message_history_created_at ON public.message_history(created_at DESC);
CREATE INDEX idx_message_history_status ON public.message_history(status);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_message_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_message_history_updated_at
BEFORE UPDATE ON public.message_history
FOR EACH ROW
EXECUTE FUNCTION public.update_message_history_updated_at();

-- Add table to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_history;