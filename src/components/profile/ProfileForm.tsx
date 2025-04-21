
import React from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileType } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";

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
  userType: z.enum(["buyer", "seller", "admin"]).optional(), // Updated to include admin
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
  // Получаем auth пользователя и права админа
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  // Логика: редактировать opt_id может только владелец или админ
  const canEditOptId = (user?.id === profile.id) || isAdmin;

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
    },
  });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные профиля</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя и фамилия</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите ваше имя" {...field} />
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
                    <Input type="email" disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип аккаунта</FormLabel>
                  <FormControl>
                    <Select
                      disabled={readOnlyUserType}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выбрать тип пользователя" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Покупатель</SelectItem>
                        <SelectItem value="seller">Продавец</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                  {readOnlyUserType && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Тип аккаунта нельзя изменить после регистрации
                    </p>
                  )}
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
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название компании</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название вашей компании" {...field} />
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

            {/* OPT ID: поле видно всем, редактировать могут только админ и владелец */}
            <FormField
              control={form.control}
              name="optId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OPT ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите ваш OPT ID"
                      {...field}
                      readOnly={!canEditOptId}
                      className={!canEditOptId ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {!canEditOptId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      OPT ID можно изменить только владельцу профиля или администратору
                    </p>
                  )}
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 w-full"
              disabled={isLoading}
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;

