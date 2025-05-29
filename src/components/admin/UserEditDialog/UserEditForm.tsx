
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { UserEditFormProps, UserFormValues } from "./types";
import { userFormSchema } from "./schema";

interface ExtendedUserEditFormProps extends UserEditFormProps {
  isMobile?: boolean;
}

export const UserEditForm = ({ user, onSubmit, isSubmitting, onClose, isMobile = false }: ExtendedUserEditFormProps) => {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      phone: user.phone || "",
      telegram: user.telegram || "",
      opt_id: user.opt_id || "",
      user_type: user.user_type,
      verification_status: user.verification_status,
    },
  });

  const handleSubmit = async (values: UserFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className={isMobile ? "space-y-6" : "space-y-4"}>
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя и фамилия</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введите имя" 
                    {...field} 
                    value={field.value || ""} 
                    className={isMobile ? "h-12 text-base" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название компании</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введите название компании" 
                    {...field} 
                    value={field.value || ""} 
                    className={isMobile ? "h-12 text-base" : ""}
                  />
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
                  <Input 
                    placeholder="+971 XX XXX XXXX" 
                    {...field} 
                    value={field.value || ""} 
                    className={isMobile ? "h-12 text-base" : ""}
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
                    value={field.value || ""} 
                    className={isMobile ? "h-12 text-base" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="opt_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OPT ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введите OPT ID" 
                    {...field} 
                    value={field.value || ""} 
                    className={isMobile ? "h-12 text-base" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип пользователя</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="buyer">Покупатель</SelectItem>
                    <SelectItem value="seller">Продавец</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verification_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Статус верификации</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="verified">Подтвержден</SelectItem>
                    <SelectItem value="blocked">Заблокирован</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Кнопки - sticky внизу на мобильных */}
        <div className={`
          flex gap-3 pt-4
          ${isMobile ? 'sticky bottom-0 bg-white border-t px-6 py-4 -mx-6 -mb-4' : ''}
        `}>
          {isMobile && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 text-base"
            >
              Отмена
            </Button>
          )}
          
          <Button 
            type="submit" 
            className={`
              ${isMobile ? 'flex-1 h-12 text-base' : 'w-full'}
            `}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Сохранение...
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
