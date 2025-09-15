import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, User, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  emailOrOptId: z.string().min(1, { message: "Введите email или OPT ID" }),
});

type FormData = z.infer<typeof formSchema>;

// Simplified input type detection
const detectInputType = (input: string): 'email' | 'opt_id' => {
  return input.includes('@') ? 'email' : 'opt_id';
};

// Simplified OPT ID to email lookup
const getEmailByOptId = async (optId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('opt_id', optId)
      .single();
    
    if (error || !data) return null;
    return data.email;
  } catch (error) {
    console.error('Error fetching email by OPT ID:', error);
    return null;
  }
};

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [inputType, setInputType] = useState<'email' | 'opt_id' | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { emailOrOptId: "" }
  });

  const watchedInput = form.watch('emailOrOptId');

  // Determine input type in real-time
  React.useEffect(() => {
    if (watchedInput) {
      const type = detectInputType(watchedInput);
      setInputType(type);
    } else {
      setInputType(null);
    }
  }, [watchedInput]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const inputType = detectInputType(data.emailOrOptId);
      let emailToUse = data.emailOrOptId;

      // If OPT ID, look up the email
      if (inputType === 'opt_id') {
        console.log("Detected OPT ID, searching for email...");
        const foundEmail = await getEmailByOptId(data.emailOrOptId);
        
        if (!foundEmail) {
          toast({
            title: "Ошибка",
            description: "OPT ID не найден",
            variant: "destructive",
          });
          return;
        }
        
        emailToUse = foundEmail;
        console.log("Found email for OPT ID:", emailToUse);
      }

      // Use standard Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить письмо. Попробуйте еще раз.",
          variant: "destructive",
        });
        return;
      }

      setEmail(emailToUse);
      setIsEmailSent(true);
      
      toast({
        title: "Письмо отправлено",
        description: `Ссылка для сброса пароля отправлена на ${emailToUse}`,
      });
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка",
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

  const getPlaceholderText = () => {
    if (inputType === 'email') return "example@mail.com";
    if (inputType === 'opt_id') return "ABC, DEF, GHI...";
    return "example@mail.com или ABC";
  };

  if (isEmailSent) {
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
                Мы отправили ссылку для сброса пароля на {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Что делать дальше:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
                  <li>• Проверьте почту (включая спам)</li>
                  <li>• Перейдите по ссылке в письме</li>
                  <li>• Создайте новый пароль</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => {
                  setIsEmailSent(false);
                  form.reset();
                }}
                variant="outline" 
                className="w-full"
              >
                Отправить еще раз
              </Button>
              
              <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Вернуться к входу
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Забыли пароль?</CardTitle>
            <CardDescription>
              Введите ваш email адрес или OPT ID, и мы отправим ссылку для сброса пароля
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
                            disabled={isLoading}
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
              </CardContent>
              
              <CardContent className="pt-0">
                <Button 
                  type="submit" 
                  className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    "Отправить ссылку"
                  )}
                </Button>
                
                <div className="flex items-center justify-center space-x-4 text-sm mt-4">
                  <Link to="/login" className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4 inline mr-1" />
                    Вернуться к входу
                  </Link>
                  <span className="text-muted-foreground">|</span>
                  <Link to="/register" className="text-muted-foreground hover:text-primary">
                    Регистрация
                  </Link>
                </div>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPassword;