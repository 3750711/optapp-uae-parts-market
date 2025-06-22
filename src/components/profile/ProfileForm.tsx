
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProfileType } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { UserTypeField } from "./fields/UserTypeField";
import { OptIdField } from "./fields/OptIdField";
import { TelegramField } from "./fields/TelegramField";
import { ProfileTextField } from "./fields/ProfileTextField";
import EmailChangeForm from "./EmailChangeForm";
import { Save, Edit } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      return /^@[^@]+$/.test(value);
    }, { 
      message: "Telegram username должен начинаться с одного @ символа" 
    }),
  optId: z.string().optional(),
  userType: z.enum(["buyer", "seller", "admin"]).optional(),
  description: z.string().max(500, { message: "Описание не должно превышать 500 символов" }).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProfileFormProps {
  profile: ProfileType;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  readOnlyUserType?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSubmit,
  isLoading,
  readOnlyUserType = true,
}) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const canEditOptId = (user?.id === profile.id) || isAdmin;
  const isSeller = profile.user_type === 'seller';
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      companyName: profile.company_name || "",
      telegram: profile.telegram || "",
      optId: profile.opt_id || "",
      userType: profile.user_type,
      description: profile.description_user || "",
    },
  });

  // Обновляем форму при изменении профиля
  useEffect(() => {
    form.reset({
      fullName: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      companyName: profile.company_name || "",
      telegram: profile.telegram || "",
      optId: profile.opt_id || "",
      userType: profile.user_type,
      description: profile.description_user || "",
    });
  }, [profile, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      form.reset({
        ...data,
        userType: profile.user_type,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleEmailChangeSuccess = () => {
    setIsEmailDialogOpen(false);
    // Принудительно обновляем поле email в форме
    form.setValue('email', profile.email || '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные профиля</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ProfileTextField
              name="fullName"
              control={form.control}
              label="Имя и фамилия"
              placeholder="Введите ваше имя"
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder=""
                        disabled={true}
                        className="flex-1"
                      />
                    </FormControl>
                    <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <EmailChangeForm
                          currentEmail={profile.email}
                          onSuccess={handleEmailChangeSuccess}
                          onCancel={() => setIsEmailDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <UserTypeField control={form.control} readOnlyUserType={readOnlyUserType} />
            <ProfileTextField
              name="phone"
              control={form.control}
              label="Телефон"
              placeholder="+971 XX XXX XXXX"
              type="tel"
            />
            {isSeller && (
              <ProfileTextField
                name="companyName"
                control={form.control}
                label="Название компании"
                placeholder="Введите название вашей компании"
              />
            )}
            <TelegramField 
              control={form.control} 
              telegram_edit_count={profile.telegram_edit_count || 0}
              initialValue={profile.telegram || ""}
            />
            <OptIdField 
              control={form.control} 
              canEditOptId={canEditOptId}
              initialValue={profile.opt_id || ""}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание профиля</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите немного о себе..."
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium text-base py-3 shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              <Save className="h-5 w-5 mr-2" />
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
