
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, Pencil } from "lucide-react";
import { ProfileType } from "./types";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string().optional(),
  optId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProfileFormProps {
  profile: ProfileType;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSubmit, isLoading }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
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
  
  React.useEffect(() => {
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
  }, [profile, form]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      form.reset({
        fullName: profile?.full_name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        companyName: profile?.company_name || "",
        telegram: profile?.telegram || "",
        optId: profile?.opt_id || "",
      });
    }
    setIsEditMode(!isEditMode);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Профиль пользователя</CardTitle>
          <CardDescription>
            {isEditMode ? "Редактирование данных профиля" : "Ваша персональная информация"}
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleEditMode}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{isEditMode ? "Отменить" : "Редактировать"}</span>
        </Button>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя и фамилия</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditMode} className={!isEditMode ? "bg-gray-50" : ""} />
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
                    <Input disabled {...field} className="bg-gray-50" />
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
                    <Input 
                      placeholder="Укажите ваш OPT ID" 
                      {...field} 
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-gray-50" : ""}
                    />
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
                    <Input 
                      type="tel" 
                      placeholder="+971 XX XXX XXXX" 
                      {...field} 
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-gray-50" : ""}
                    />
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
                    <Input 
                      placeholder="@username" 
                      {...field} 
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-gray-50" : ""}
                    />
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
                    <Input 
                      placeholder="Ваша компания" 
                      {...field} 
                      disabled={!isEditMode}
                      className={!isEditMode ? "bg-gray-50" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          {isEditMode && (
            <CardFooter className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={toggleEditMode}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Сохранить изменения
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
};

export default ProfileForm;
