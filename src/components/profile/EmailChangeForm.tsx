
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Loader2, Mail } from 'lucide-react';

export const EmailChangeForm: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Email обновлен",
        description: "Проверьте новый email для подтверждения изменений",
      });

      setNewEmail('');
      await refreshProfile();
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Изменить Email
        </CardTitle>
        <CardDescription>
          Текущий email: {user?.email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <Label htmlFor="newEmail">Новый Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Введите новый email"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading || !newEmail}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обновление...
              </>
            ) : (
              'Обновить Email'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailChangeForm;
