import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';

const formSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный email адрес",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface EmailChangeFormProps {
  currentEmail: string | undefined;
  onEmailChangeSuccess: () => void;
}

const EmailChangeForm: React.FC<EmailChangeFormProps> = ({ currentEmail, onEmailChangeSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: currentEmail || "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (!user) {
        setError("Пользователь не авторизован");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) {
        setError(error.message);
      } else {
        setIsSuccess(true);
        onEmailChangeSuccess();
      }
    } catch (error: any) {
      setError(error.message || "Произошла ошибка при смене email");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сменить Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSuccess && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Email успешно изменен!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Введите новый email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Отправка..." : "Сменить Email"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmailChangeForm;
