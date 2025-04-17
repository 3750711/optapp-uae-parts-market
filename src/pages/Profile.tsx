import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Star, StarHalf, User } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string().optional(),
  optId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState<string>("");
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      companyName: profile?.company_name || "",
      telegram: profile?.telegram || "",
      optId: profile?.opt_id || "",
    }
  });
  
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    
    if (profile) {
      form.reset({
        fullName: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        companyName: profile.company_name || "",
        telegram: profile.telegram || "",
        optId: profile.opt_id || "",
      });
    }
  }, [profile, user, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          company_name: data.companyName,
          telegram: data.telegram,
          opt_id: data.optId,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message || "Произошла ошибка при обновлении данных",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) throw error;
      
      await signOut();
      toast({
        title: "Аккаунт удален",
        description: "Ваш аккаунт был успешно удален",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Ошибка удаления аккаунта",
        description: error.message || "Произошла ошибка при удалении аккаунта",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactAdmin = () => {
    if (!profile) return;
    
    const messageText = `Здравствуйте! Я пользователь с OPT ID: ${profile.opt_id || 'не указан'}\nИмя: ${profile.full_name || 'не указано'}\nEmail: ${profile.email || 'не указан'}\nТелефон: ${profile.phone || 'не указан'}\nКомпания: ${profile.company_name || 'не указана'}\n\nМое сообщение:`;
    
    const encodedMessage = encodeURIComponent(messageText);
    
    window.open(`https://t.me/ElenaOPTcargo?text=${encodedMessage}`, '_blank');
  };

  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-star-${i}`} className="h-5 w-5 text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}/5</span>
      </div>
    );
  };

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Профиль пользователя</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
                <Avatar className="h-32 w-32 mb-6">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="text-4xl bg-optapp-yellow text-optapp-dark">
                    {profile?.full_name?.charAt(0) || <User size={32} />}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{profile?.full_name || 'Пользователь'}</h2>
                <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    profile?.user_type === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {profile?.user_type === 'seller' ? 'Продавец' : 'Покупатель'}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    profile?.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile?.verification_status === 'verified' ? 'Проверено' : 'Ожидает проверки'}
                  </span>
                </div>
                {profile?.opt_id && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">OPT ID:</p>
                    <p className="text-lg font-semibold p-2 bg-gray-100 rounded-md">{profile?.opt_id}</p>
                  </div>
                )}
                
                {profile?.rating && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Рейтинг:</p>
                    {renderRatingStars(profile?.rating)}
                  </div>
                )}
                
                <div className="mt-6 w-full space-y-4">
                  <Button 
                    onClick={handleContactAdmin}
                    className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                  >
                    Связаться с администратором
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Удалить аккаунт
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие удалит ваш аккаунт и все связанные данные навсегда. 
                          Данное действие не может быть отменено.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Информация аккаунта</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Дата регистрации</p>
                    <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                  </div>
                  {profile?.last_login && (
                    <div>
                      <p className="text-sm text-gray-500">Последний вход</p>
                      <p>{new Date(profile?.last_login).toLocaleDateString()}</p>
                    </div>
                  )}
                  {profile?.user_type === 'seller' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Количество объявлений</p>
                        <p>{profile?.listing_count}</p>
                      </div>
                      {profile?.rating && (
                        <div>
                          <p className="text-sm text-gray-500">Рейтинг</p>
                          {renderRatingStars(profile?.rating)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>Редактировать профиль</CardTitle>
                <CardDescription>
                  Обновите вашу персональную информацию
                </CardDescription>
              </CardHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя и фамилия</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input disabled {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500">Email нельзя изменить</p>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="optId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OPT ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Укажите ваш OPT ID" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500">Уникальный идентификатор в системе OPT</p>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+971 XX XXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="telegram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telegram</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название компании</FormLabel>
                          <FormControl>
                            <Input placeholder="Ваша компания" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Сохранить изменения
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
