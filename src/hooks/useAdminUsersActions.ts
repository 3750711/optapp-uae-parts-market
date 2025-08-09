
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
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Starting admin deletion flow for user:', userId);
      }

      // Fetch email for fallback deletion path
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch profile email for fallback. Proceeding with ID only.', profileError);
      }

      // Helper: interpret various success shapes from RPC
      const isSuccess = (d: any) => d === true || (d && typeof d === 'object' && (d.success === true || d.status === 'success'));

      // 1) Try delete by user ID first
      let rpcData: any | null = null;
      let rpcError: any | null = null;

      const { data: byIdData, error: byIdError } = await supabase.rpc(
        'admin_delete_specific_user' as any,
        { p_user_id: userId } as any
      );

      if (!byIdError && isSuccess(byIdData)) {
        rpcData = byIdData;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Delete by ID failed or returned non-success:', byIdError?.message, byIdData);
        }
        // 2) Fallback by email if available
        if (userProfile?.email) {
          const { data: byEmailData, error: byEmailError } = await supabase.rpc(
            'admin_delete_specific_user' as any,
            { p_user_email: userProfile.email } as any
          );
          if (!byEmailError && isSuccess(byEmailData)) {
            rpcData = byEmailData;
          } else {
            rpcError = byEmailError || byIdError || new Error('Unknown RPC failure');
          }
        } else {
          rpcError = byIdError || new Error('No email available for fallback deletion');
        }
      }

      if (rpcError) {
        console.error('Error deleting user via RPC:', rpcError);
        // Specific error handling
        const msg = rpcError.message || String(rpcError);
        if (msg.includes('Only admins can use this function')) {
          toast({
            title: 'Доступ запрещен',
            description: 'Только администраторы могут удалять пользователей',
            variant: 'destructive',
          });
        } else if (msg.includes('not found')) {
          toast({
            title: 'Пользователь не найден',
            description: 'Пользователь уже был удален или не существует',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Ошибка удаления',
            description: `Не удалось удалить пользователя: ${msg}`,
            variant: 'destructive',
          });
        }
        return false;
      }

      if (isSuccess(rpcData)) {
        toast({
          title: 'Пользователь удален',
          description:
            'Аккаунт пользователя и связанные данные удалены. Создана резервная копия операции (если настроено).',
        });
        // Refresh users
        queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
        return true;
      }

      toast({
        title: 'Ошибка',
        description: 'Операция удаления не была подтверждена бэкендом',
        variant: 'destructive',
      });
      return false;
    } catch (error: any) {
      console.error('Error deleting user (unexpected):', error);
      toast({
        title: 'Критическая ошибка',
        description: 'Произошла неожиданная ошибка при удалении пользователя',
        variant: 'destructive',
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

  const sendPersonalTelegramMessage = async (userId: string, messageText: string, images?: string[]) => {
    try {
      console.log('=== SENDING PERSONAL TELEGRAM MESSAGE ===');
      console.log('User ID:', userId);
      console.log('Message length:', messageText.length);
      console.log('Images count:', images?.length || 0);

      // Use simplified approach like the notification system
      const { data, error } = await supabase.functions.invoke('send-personal-telegram-message', {
        body: {
          user_id: userId,
          message_text: messageText,
          images: images || []
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        toast({
          title: "Ошибка",
          description: `Не удалось отправить сообщение: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      if (!data?.success) {
        console.error('Function returned error:', data);
        toast({
          title: "Ошибка",
          description: data?.error || "Не удалось отправить сообщение",
          variant: "destructive"
        });
        return false;
      }

      console.log('Personal Telegram message sent successfully:', data);
      
      toast({
        title: "Успех",
        description: "Сообщение в Telegram отправлено"
      });
      
      return true;
    } catch (error) {
      console.error('Error sending personal telegram message:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке сообщения",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    handleQuickStatusChange,
    handleOptStatusChange,
    handleBulkAction,
    handleExportUsers,
    handleContextAction,
    handleDeleteUser,
    sendPersonalTelegramMessage
  };
};
