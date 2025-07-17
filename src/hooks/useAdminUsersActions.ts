
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { ProfileType } from '@/components/profile/types';

export const useAdminUsersActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleQuickStatusChange = async (userId: string, newStatus: 'verified' | 'pending' | 'blocked') => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус пользователя",
        variant: "destructive"
      });
    } else {
      const { data: userData } = await supabase
        .from('profiles')
        .select('telegram')
        .eq('id', userId)
        .single();

      if (userData?.telegram) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: JSON.stringify({
              userId,
              status: newStatus,
              telegram: userData.telegram
            })
          });
        } catch (notificationError) {
          console.error('Failed to send Telegram notification:', notificationError);
        }
      }

      toast({
        title: "Успех",
        description: "Статус пользователя обновлен"
      });
      // Исправляем кэш-инвалидацию для оптимизированного хука
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
    }
  };

  const handleOptStatusChange = async (userId: string, newStatus: 'free_user' | 'opt_user') => {
    const { error } = await supabase
      .from('profiles')
      .update({ opt_status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить OPT статус пользователя",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Успех",
        description: "OPT статус пользователя обновлен"
      });
      // Исправляем кэш-инвалидацию для оптимизированного хука
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
    }
  };

  const handleBulkAction = async (action: string, selectedUsers: string[]) => {
    if (selectedUsers.length === 0) return;

    const statusMap: Record<string, 'verified' | 'pending' | 'blocked'> = {
      verify: 'verified',
      block: 'blocked',
      pending: 'pending'
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .in('id', selectedUsers);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Статус ${selectedUsers.length} пользователей обновлен`
      });
      
      // Исправляем кэш-инвалидацию для оптимизированного хука
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователей",
        variant: "destructive"
      });
    }
  };

  const handleExportUsers = (users: ProfileType[]) => {
    const exportData = users.map(user => ({
      'Имя': user.full_name || '',
      'Email': user.email,
      'Телефон': user.phone || '',
      'Телеграм': user.telegram || '',
      'Компания': user.company_name || '',
      'OPT ID': user.opt_id || '',
      'Тип пользователя': user.user_type,
      'Статус верификации': user.verification_status,
      'OPT статус': user.opt_status,
      'Рейтинг': user.rating || '',
      'Коммуникация': user.communication_ability || '',
      'Местоположение': user.location || '',
      'Дата регистрации': new Date(user.created_at).toLocaleDateString('ru-RU')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Пользователи');
    XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Успех",
      description: "Данные пользователей экспортированы"
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Вызываем функцию для удаления аккаунта пользователя
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: userId
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Ошибка",
          description: `Не удалось удалить аккаунт пользователя: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Успех",
        description: "Аккаунт пользователя был успешно удален"
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении аккаунта",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleContextAction = (userId: string, action: string) => {
    const statusMap: Record<string, 'verified' | 'pending' | 'blocked'> = {
      verify: 'verified',
      block: 'blocked',
      pending: 'pending'
    };

    const newStatus = statusMap[action];
    if (newStatus) {
      handleQuickStatusChange(userId, newStatus);
    } else if (action === 'delete') {
      // Добавляем обработку удаления
      if (confirm('Вы уверены, что хотите удалить этот аккаунт? Это действие нельзя отменить.')) {
        handleDeleteUser(userId);
      }
    }
  };

  return {
    handleQuickStatusChange,
    handleOptStatusChange,
    handleBulkAction,
    handleExportUsers,
    handleContextAction,
    handleDeleteUser
  };
};
