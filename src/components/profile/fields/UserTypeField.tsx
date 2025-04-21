
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface UserTypeFieldProps {
  control: any;
  readOnlyUserType: boolean;
}

export const UserTypeField: React.FC<UserTypeFieldProps> = ({
  control,
  readOnlyUserType,
}) => (
  <FormField
    control={control}
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
);
