
import { supabase } from "@/integrations/supabase/client";

// Функция для определения типа ввода (email или OPT ID)
export const detectInputType = (input: string): 'email' | 'opt_id' => {
  // Простая проверка на email формат
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input) ? 'email' : 'opt_id';
};

// Функция для получения email по OPT ID
export const getEmailByOptId = async (optId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('get_email_by_opt_id', {
      p_opt_id: optId
    });

    if (error) {
      console.error('Error getting email by OPT ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception getting email by OPT ID:', error);
    return null;
  }
};

// Функция для проверки существования OPT ID
export const checkOptIdExists = async (optId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_opt_id_exists', {
      p_opt_id: optId
    });

    if (error) {
      console.error('Error checking OPT ID exists:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Exception checking OPT ID exists:', error);
    return false;
  }
};
