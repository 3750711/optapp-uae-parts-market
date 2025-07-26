
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getProfileTranslations } from "@/utils/profileTranslations";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile } = useAuth();
  const t = getProfileTranslations(profile?.user_type || 'buyer');
  
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
              placeholder={t.optIdPlaceholder}
              {...field}
              readOnly={!isEditable}
              className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
            />
          </FormControl>
          <FormMessage />
          {!isEditable && initialValue && (
            <p className="text-sm text-yellow-600 mt-1">
              {t.optIdChangeContact}
            </p>
          )}
          {!isEditable && !initialValue && (
            <p className="text-sm text-muted-foreground mt-1">
              {t.optIdAccessDenied}
            </p>
          )}
          {isEditable && (
            <p className="text-sm text-muted-foreground mt-1">
              {t.optIdOnceOnly}
            </p>
          )}
        </FormItem>
      )}
    />
  );
};
