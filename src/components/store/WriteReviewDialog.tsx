
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface WriteReviewDialogProps {
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const reviewFormSchema = z.object({
  rating: z.string().min(1, 'Пожалуйста, выберите оценку'),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const WriteReviewDialog: React.FC<WriteReviewDialogProps> = ({ 
  storeId, 
  open, 
  onOpenChange,
  onSubmitted
}) => {
  const { user } = useAuth();
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: '',
      comment: '',
    },
  });
  
  const onSubmit = async (values: ReviewFormValues) => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Вы должны быть авторизованы для отправки отзыва',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('store_reviews')
        .insert({
          store_id: storeId,
          user_id: user.id,
          rating: parseInt(values.rating, 10),
          comment: values.comment || null,
        });
        
      if (error) throw error;
      
      toast({
        title: 'Отзыв отправлен',
        description: 'Спасибо за ваш отзыв!',
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Написать отзыв</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Оценка</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-3"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem key={rating} className="flex flex-col items-center space-y-1">
                          <FormControl>
                            <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} className="sr-only" />
                          </FormControl>
                          <Label
                            htmlFor={`rating-${rating}`}
                            className={`cursor-pointer p-2 rounded-full hover:bg-accent ${
                              field.value === rating.toString() ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            <Star className={`w-6 h-6 ${field.value === rating.toString() ? 'fill-primary' : ''}`} />
                          </Label>
                          <Label
                            htmlFor={`rating-${rating}`}
                            className="text-xs font-normal"
                          >
                            {rating}
                          </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Напишите ваш отзыв о магазине"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit">Отправить отзыв</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewDialog;
