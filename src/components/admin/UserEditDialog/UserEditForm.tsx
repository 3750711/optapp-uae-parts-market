
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { UserEditFormProps, UserFormValues } from "./types";
import { createUserFormSchema } from "./schema";
import { useLanguage } from "@/hooks/useLanguage";
import { getCommonTranslations } from "@/utils/translations/common";
import { allowedLocalesFor } from "@/utils/languageVisibility";
import { normalizeDecimal } from '@/utils/number';

interface ExtendedUserEditFormProps extends UserEditFormProps {
  isMobile?: boolean;
}

export const UserEditForm = ({ user, onSubmit, isSubmitting, onClose, isMobile = false }: ExtendedUserEditFormProps) => {
  const { language } = useLanguage();
  const c = getCommonTranslations(language);
  const userFormSchema = React.useMemo(() => createUserFormSchema(user), [user]);
  
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
      communication_ability: user.communication_ability || 3,
      rating: user.rating?.toString() || "",
      is_trusted_seller: user.is_trusted_seller || false,
      preferred_locale: user.preferred_locale as "ru" | "en" | "bn",
    },
  });

  // Watch for user_type changes and auto-reset language to Russian for buyers
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'user_type' && value.user_type === 'buyer') {
        form.setValue('preferred_locale', 'ru');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Рейтинг (0-5)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="5" 
                    placeholder="Введите рейтинг" 
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
            name="communication_ability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Способность к коммуникации</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(normalizeDecimal(value))} 
                  defaultValue={field.value?.toString() || "3"}
                >
                  <FormControl>
                    <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                      <SelectValue placeholder="Выберите рейтинг" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 - Очень сложно договориться</SelectItem>
                    <SelectItem value="2">2 - Сложно договориться</SelectItem>
                    <SelectItem value="3">3 - Средне</SelectItem>
                    <SelectItem value="4">4 - Легко договориться</SelectItem>
                    <SelectItem value="5">5 - Очень легко договориться</SelectItem>
                  </SelectContent>
                </Select>
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

          <FormField
            control={form.control}
            name="preferred_locale"
            render={({ field }) => {
              const currentUserType = form.watch("user_type");
              const allowedLanguages = allowedLocalesFor(currentUserType, "/");
              
              return (
                <FormItem>
                  <FormLabel>{c.fields.preferredLanguage}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                        <SelectValue placeholder="Выберите язык" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allowedLanguages.includes('ru') && (
                        <SelectItem value="ru">{c.languages.ru}</SelectItem>
                      )}
                      {allowedLanguages.includes('en') && (
                        <SelectItem value="en">{c.languages.en}</SelectItem>
                      )}
                      {allowedLanguages.includes('bn') && (
                        <SelectItem value="bn">{c.languages.bn}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {currentUserType === 'buyer' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Покупатели могут использовать только русский язык
                    </p>
                  )}
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="is_trusted_seller"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Доверенный продавец
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Товары доверенных продавцов публикуются автоматически без модерации
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

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
