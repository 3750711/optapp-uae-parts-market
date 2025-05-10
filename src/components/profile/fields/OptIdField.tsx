
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface OptIdFieldProps {
  control: any;
  canEditOptId: boolean;
  initialValue?: string;
}

export const OptIdField: React.FC<OptIdFieldProps> = ({ 
  control, 
  canEditOptId,
  initialValue = ""
}) => {
  // Can only edit if: has permission AND the field is currently empty
  const isEditable = canEditOptId && initialValue === "";
  
  return (
    <FormField
      control={control}
      name="optId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>OPT ID</FormLabel>
          <FormControl>
            <Input
              placeholder="Введите ваш OPT ID"
              {...field}
              readOnly={!isEditable}
              className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
            />
          </FormControl>
          <FormMessage />
          {!isEditable && initialValue && (
            <p className="text-sm text-yellow-600 mt-1">
              OPT ID можно указать только один раз
            </p>
          )}
          {!isEditable && !initialValue && (
            <p className="text-sm text-muted-foreground mt-1">
              OPT ID можно изменить только владельцу профиля или администратору
            </p>
          )}
          {isEditable && (
            <p className="text-sm text-muted-foreground mt-1">
              Укажите OPT ID. После сохранения изменить его будет нельзя.
            </p>
          )}
        </FormItem>
      )}
    />
  );
};
