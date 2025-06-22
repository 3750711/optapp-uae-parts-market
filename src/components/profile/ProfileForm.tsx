import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MessageCircle, 
  UserCheck,
  Save,
  Loader2 
} from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string().optional(),
  optId: z.string().optional(),
  description: z.string().max(500, { message: "Описание не должно превышать 500 символов" }).optional(),
  userType: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProfileFormProps {
  profile: any;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  readOnlyUserType?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSubmit, isLoading, readOnlyUserType = false }) => {
  const { user } = useAuth();
  const [isOptIdUnique, setIsOptIdUnique] = useState<boolean | null>(null);
  const [isCheckingOptId, setIsCheckingOptId] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || "",
      companyName: profile?.company_name || "",
      telegram: profile?.telegram || "",
      optId: profile?.opt_id || "",
      description: profile?.description_user || "",
      userType: profile?.user_type || "buyer",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      fullName: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phone || "",
      companyName: profile?.company_name || "",
      telegram: profile?.telegram || "",
      optId: profile?.opt_id || "",
      description: profile?.description_user || "",
      userType: profile?.user_type || "buyer",
    });
  }, [profile, user, form]);

  const checkOptIdUniqueness = async (optId: string) => {
    if (!optId) {
      setIsOptIdUnique(null);
      return;
    }
  
    setIsCheckingOptId(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('opt_id', optId)
        .not('id', 'eq', user?.id);
  
      if (error) {
        console.error("Ошибка при проверке OPT ID:", error);
        setIsOptIdUnique(false);
        return;
      }
  
      setIsOptIdUnique(!data || data.length === 0);
    } finally {
      setIsCheckingOptId(false);
    }
  };

  const handleOptIdChange = async (optId: string) => {
    form.setValue("optId", optId);
    await checkOptIdUniqueness(optId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация профиля</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Ваше полное имя" {...field} />
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
                    <Input placeholder="example@mail.com" {...field} type="email" readOnly />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="+7 (999) 999-99-99" {...field} />
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
                    <Input placeholder="Название вашей компании" {...field} />
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите немного о себе"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
