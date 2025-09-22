import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AIFeedbackSystemProps {
  productId: string;
  enrichmentId?: string;
  aiSuggestions: {
    title?: string;
    brand?: string;
    model?: string;
    confidence: number;
  };
  originalData: {
    title: string;
    brand?: string;
    model?: string;
  };
  className?: string;
}

type FeedbackType = 'positive' | 'negative' | null;

export const AIFeedbackSystem: React.FC<AIFeedbackSystemProps> = ({
  productId,
  enrichmentId,
  aiSuggestions,
  originalData,
  className
}) => {
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  const submitFeedback = async (feedbackType: FeedbackType, notes?: string) => {
    if (!feedbackType) return;
    
    setIsSubmitting(true);
    try {
      // Сохраняем обратную связь в AI training data
      const { error } = await supabase
        .from('ai_training_data')
        .insert({
          original_text: originalData.title,
          corrected_text: aiSuggestions.title || originalData.title,
          brand_detected: aiSuggestions.brand,
          model_detected: aiSuggestions.model,
          moderator_corrections: {
            feedback_type: feedbackType,
            confidence: aiSuggestions.confidence,
            moderator_notes: notes,
            suggestions_quality: feedbackType === 'positive' ? 'good' : 'poor',
            original_data: originalData,
            ai_suggestions: aiSuggestions
          }
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Спасибо за обратную связь!",
        description: "Ваша оценка поможет улучшить качество AI",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить обратную связь",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedback = (type: FeedbackType) => {
    setFeedback(type);
    submitFeedback(type);
  };

  if (hasSubmitted) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Спасибо за обратную связь!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = 
    (aiSuggestions.title && aiSuggestions.title !== originalData.title) ||
    (aiSuggestions.brand && aiSuggestions.brand !== originalData.brand) ||
    (aiSuggestions.model && aiSuggestions.model !== originalData.model);

  if (!hasChanges) {
    return null;
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Оцените качество AI предложений</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                aiSuggestions.confidence >= 0.8 ? "border-green-200 text-green-700" :
                aiSuggestions.confidence >= 0.6 ? "border-yellow-200 text-yellow-700" :
                "border-red-200 text-red-700"
              )}
            >
              {Math.round(aiSuggestions.confidence * 100)}%
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            AI предложил {
              [
                aiSuggestions.title !== originalData.title && "исправить название",
                aiSuggestions.brand !== originalData.brand && "добавить бренд",
                aiSuggestions.model !== originalData.model && "добавить модель"
              ].filter(Boolean).join(", ")
            }
          </div>

          <div className="flex gap-2">
            <Button
              variant={feedback === 'positive' ? "default" : "outline"}
              size="sm"
              onClick={() => handleFeedback('positive')}
              disabled={isSubmitting || hasSubmitted}
              className="flex-1 gap-2"
            >
              <ThumbsUp className="h-3 w-3" />
              Точно
            </Button>
            
            <Button
              variant={feedback === 'negative' ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleFeedback('negative')}
              disabled={isSubmitting || hasSubmitted}
              className="flex-1 gap-2"
            >
              <ThumbsDown className="h-3 w-3" />
              Неточно
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};