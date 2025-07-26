
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
import { getProfileTranslations } from "@/utils/profileTranslations";
import { useAuth } from "@/contexts/AuthContext";

interface UserTypeFieldProps {
  control: any;
  readOnlyUserType: boolean;
}

export const UserTypeField: React.FC<UserTypeFieldProps> = ({
  control,
  readOnlyUserType,
}) => {
  const { profile } = useAuth();
  const t = getProfileTranslations(profile?.user_type || 'buyer');

  return (
    <FormField
      control={control}
      name="userType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t.accountType}</FormLabel>
          <FormControl>
            <Select
              disabled={readOnlyUserType}
              onValueChange={field.onChange}
              value={field.value}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectUserType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">{t.buyerType}</SelectItem>
                <SelectItem value="seller">{t.sellerType}</SelectItem>
                <SelectItem value="admin">{t.adminType}</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
          {readOnlyUserType && (
            <p className="text-sm text-muted-foreground mt-1">
              {t.userTypeReadOnly}
            </p>
          )}
        </FormItem>
      )}
    />
  );
};
