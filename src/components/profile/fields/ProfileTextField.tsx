
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ProfileTextFieldProps {
  name: string;
  control: any;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export const ProfileTextField: React.FC<ProfileTextFieldProps> = ({
  name, control, label, placeholder, type = "text", disabled = false
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
