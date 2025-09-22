import { useCallback } from 'react';
import { useCurrentUserProfile } from './useCurrentUserProfile';

export const useRoleValidation = () => {
  const { data: currentUserProfile, isLoading } = useCurrentUserProfile();

  const validateTrustedSeller = useCallback(() => {
    if (isLoading) {
      throw new Error('Загрузка данных пользователя...');
    }

    if (!currentUserProfile) {
      throw new Error('Не удалось получить данные пользователя');
    }

    if (!currentUserProfile.is_trusted_seller) {
      throw new Error('Недостаточно прав для создания товара. Вы должны быть доверенным продавцом.');
    }

    return true;
  }, [currentUserProfile, isLoading]);

  const validateAdmin = useCallback(() => {
    if (isLoading) {
      throw new Error('Загрузка данных пользователя...');
    }

    if (!currentUserProfile) {
      throw new Error('Не удалось получить данные пользователя');
    }

    if (currentUserProfile.user_type !== 'admin') {
      throw new Error('Недостаточно прав. Только администраторы могут выполнить это действие.');
    }

    return true;
  }, [currentUserProfile, isLoading]);

  const isTrustedSeller = currentUserProfile?.is_trusted_seller || false;
  const isAdmin = currentUserProfile?.user_type === 'admin';
  const isSeller = currentUserProfile?.user_type === 'seller';

  return {
    validateTrustedSeller,
    validateAdmin,
    isTrustedSeller,
    isAdmin,
    isSeller,
    currentUserProfile,
    isLoading
  };
};