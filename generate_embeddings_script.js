// Temporary script to generate embeddings for all products
import { createClient } from '@supabase/supabase-js';

// Use environment variables for configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vfiylfljiixqkjfqubyq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateAllEmbeddings() {
  console.log('Starting embeddings generation for all products...');
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        batchSize: 50 // Process in batches of 50
      }
    });

    if (error) {
      console.error('Error generating embeddings:', error);
      return;
    }

    console.log('Embeddings generation result:', data);
  } catch (error) {
    console.error('Failed to call generate-embeddings function:', error);
  }
}

// Run the script
generateAllEmbeddings();