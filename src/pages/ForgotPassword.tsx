
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { Mail, User, ArrowLeft, CheckCircle } from "lucide-react";
import SimpleCaptcha from "@/components/ui/SimpleCaptcha";

const formSchema = z.object({
  emailOrOptId: z.string().min(1, { message: "Введите email или OPT ID" }),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'opt_id' | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [sentToEmail, setSentToEmail] = useState<string>("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrOptId: "",
    }
  });

  const watchedInput = form.watch('emailOrOptId');

  // Определяем тип ввода в реальном времени
  React.useEffect(() => {
    if (watchedInput) {
      const type = detectInputType(watchedInput);
      setInputType(type);
    } else {
      setInputType(null);
    }
  }, [watchedInput]);

  const handleFailedAttempt = () => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);
    
    // Показываем CAPTCHA после 2 неудачных попыток
    if (newFailedAttempts >= 2) {
      setShowCaptcha(true);
      setCaptchaVerified(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    // Проверяем CAPTCHA если она требуется
    if (showCaptcha && !captchaVerified) {
      toast({
        title: "Необходима проверка",
        description: "Пожалуйста, пройдите проверку CAPTCHA",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Attempting password reset for:", data.emailOrOptId);
      
      const inputType = detectInputType(data.emailOrOptId);
      let emailToUse = data.emailOrOptId;

      // Если введен OPT ID, найдем соответствующий email
      if (inputType === 'opt_id') {
        console.log("Detected OPT ID, searching for email...");
        const result = await getEmailByOptId(data.emailOrOptId);
        
        if (result.isRateLimited) {
          toast({
            title: "Слишком много попыток",
            description: "Попробуйте через 15 минут",
            variant: "destructive",
          });
          return;
        }
        
        if (!result.email) {
          handleFailedAttempt();
          toast({
            title: "Ошибка",
            description: "OPT ID не найден",
            variant: "destructive",
          });
          return;
        }
        
        emailToUse = result.email;
        console.log("Found email for OPT ID:", emailToUse);
      }

      // Отправляем запрос на сброс пароля через Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        handleFailedAttempt();
        
        // Показываем общее сообщение об ошибке
        toast({
          title: "Ошибка",
          description: "Не удалось отправить письмо для сброса пароля",
          variant: "destructive",
        });
        return;
      }

      // Успешно отправлено
      setEmailSent(true);
      setSentToEmail(emailToUse);
      setFailedAttempts(0);
      setShowCaptcha(false);
      setCaptchaVerified(false);

      toast({
        title: "Письмо отправлено",
        description: `Инструкции по сбросу пароля отправлены на ${emailToUse}`,
      });
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      handleFailedAttempt();
      
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке письма",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  if (emailSent) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Письмо отправлено</CardTitle>
              <CardDescription>
                Мы отправили инструкции по сбросу пароля на
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="font-medium text-primary mb-4">{sentToEmail}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Проверьте свою почту и следуйте инструкциям в письме для сброса пароля.
                Если письмо не пришло, проверьте папку со спамом.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться к входу
                </Link>
              </Button>
              <Button 
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                variant="ghost" 
                className="w-full"
              >
                Отправить еще раз
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Забыли пароль?</CardTitle>
            <CardDescription>
              Введите свой email или OPT ID, и мы отправим инструкции по сбросу пароля
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
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

                {showCaptcha && (
                  <SimpleCaptcha
                    isVisible={showCaptcha}
                    onVerify={setCaptchaVerified}
                  />
                )}

                {failedAttempts > 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Неудачных попыток: {failedAttempts}/2
                    {failedAttempts >= 2 && " (требуется CAPTCHA)"}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoading || (showCaptcha && !captchaVerified)}
                >
                  {isLoading ? "Отправка..." : "Отправить инструкции"}
                </Button>
                
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <Link to="/login" className="text-optapp-dark hover:underline">
                    <ArrowLeft className="h-4 w-4 inline mr-1" />
                    Вернуться к входу
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link to="/register" className="text-optapp-dark hover:underline">
                    Регистрация
                  </Link>
                </div>
                
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                  <p>💡 Подсказка: Вы можете использовать:</p>
                  <p>• Email адрес (example@mail.com)</p>
                  <p>• OPT ID ({generateRandomOptId()}, {generateRandomOptId()}, {generateRandomOptId()} и т.д.)</p>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
