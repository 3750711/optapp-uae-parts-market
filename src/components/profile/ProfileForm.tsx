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
import { UserTypeField } from "./fields/UserTypeField";
import { OptIdField } from "./fields/OptIdField";
import { TelegramField } from "./fields/TelegramField";
import { ProfileTextField } from "./fields/ProfileTextField";

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
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
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
            <ProfileTextField
              name="fullName"
              control={form.control}
              label="Имя и фамилия"
              placeholder="Введите ваше имя"
            />
            <ProfileTextField
              name="email"
              control={form.control}
              label="Email"
              placeholder=""
              type="email"
              disabled={true}
            />
            <UserTypeField control={form.control} readOnlyUserType={readOnlyUserType} />
            <ProfileTextField
              name="phone"
              control={form.control}
              label="Телефон"
              placeholder="+971 XX XXX XXXX"
              type="tel"
            />
            <ProfileTextField
              name="companyName"
              control={form.control}
              label="Название компании"
              placeholder="Введите название вашей компании"
            />
            <TelegramField control={form.control} />
            <OptIdField control={form.control} canEditOptId={canEditOptId} />
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
