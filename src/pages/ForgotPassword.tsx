import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { detectInputType, getEmailByOptId } from "@/utils/authUtils";
import { Mail, User, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/SimpleAuthContext";

const formSchema = z.object({
  emailOrOptId: z.string().min(1, { message: "Введите email или OPT ID" }),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'opt_id' | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrOptId: "",
    },
  });

  const watchedInput = form.watch('emailOrOptId');

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Determine input type in real time
  useEffect(() => {
    if (watchedInput) {
      const type = detectInputType(watchedInput);
      setInputType(type);
    } else {
      setInputType(null);
    }
  }, [watchedInput]);

  const onSubmit = async (data: FormData) => {
    setIsLoadingForm(true);
    try {
      const inputType = detectInputType(data.emailOrOptId);
      let emailToUse = data.emailOrOptId;

      if (inputType === 'opt_id') {
        const result = await getEmailByOptId(data.emailOrOptId);
        if (!result.email) {
          toast({
            title: "Ошибка",
            description: "Пользователь с таким OPT ID не найден",
            variant: "destructive",
          });
          return;
        }
        emailToUse = result.email;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailToUse,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить ссылку для восстановления пароля",
          variant: "destructive",
        });
        return;
      }

      setFormSubmitted(true);
      toast({
        title: "Проверьте свою почту",
        description: "Мы отправили вам ссылку для восстановления пароля",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingForm(false);
    }
  };

  const getInputIcon = () => {
    if (inputType === 'email') return <Mail className="h-4 w-4 text-green-500" />;
    if (inputType === 'opt_id') return <User className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const generateRandomOptId = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  };

  const getPlaceholderText = () => {
    if (inputType === 'email') return "example@mail.com";
    if (inputType === 'opt_id') return `${generateRandomOptId()}, ${generateRandomOptId()}, ${generateRandomOptId()}...`;
    return `example@mail.com или ${generateRandomOptId()}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <Button variant="ghost" size="sm" className="pl-0 justify-start" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <CardTitle className="text-2xl font-bold">Забыли пароль?</CardTitle>
            <CardDescription>
              Введите свой email или OPT ID, и мы отправим вам ссылку для восстановления пароля
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formSubmitted ? (
              <Alert className="bg-green-50 border border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Ссылка для восстановления пароля отправлена на ваш email.
                  Проверьте папку "Спам", если не видите письмо во входящих.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emailOrOptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email или OPT ID</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder={getPlaceholderText()}
                              {...field}
                              className="pr-10"
                              disabled={isLoadingForm}
                            />
                            {getInputIcon() && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {getInputIcon()}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        {inputType && (
                          <p className="text-xs text-muted-foreground">
                            {inputType === 'email'
                              ? "✓ Определен как email адрес"
                              : "✓ Определен как OPT ID"}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoadingForm}>
                    {isLoadingForm ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      "Отправить ссылку для восстановления"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:underline">
              Вернуться ко входу
            </Link>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
