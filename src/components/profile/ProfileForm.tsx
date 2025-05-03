
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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileType } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { UserTypeField } from "./fields/UserTypeField";
import { OptIdField } from "./fields/OptIdField";
import { TelegramField } from "./fields/TelegramField";
import { ProfileTextField } from "./fields/ProfileTextField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/data/countries";
import { MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  location: z.string().min(2, { message: "Укажите местоположение" }).optional(),
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
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [mapUrl, setMapUrl] = useState("");

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
      location: profile.location || "Dubai",
    },
  });

  // Update map URL when location changes
  useEffect(() => {
    const location = form.watch("location");
    if (location) {
      setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`);
    }
  }, [form.watch("location")]);

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
            <TelegramField 
              control={form.control} 
              telegram_edit_count={profile.telegram_edit_count || 0}
            />
            <OptIdField control={form.control} canEditOptId={canEditOptId} />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Местоположение *</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Выберите страну" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[300px] md:w-[500px]" align="end">
                          <div className="aspect-video w-full">
                            <iframe
                              src={mapUrl}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Google Maps"
                            ></iframe>
                          </div>
                          <div className="p-2 text-xs text-muted-foreground">
                            Текущее местоположение: {field.value}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <FormDescription>
                    Это местоположение будет использоваться для вашего магазина
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
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
              className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
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
