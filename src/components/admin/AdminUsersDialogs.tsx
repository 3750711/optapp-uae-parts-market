
import React from 'react';
import { UserEditDialog } from './UserEditDialog';
import { UserRatingDialog } from './UserRatingDialog';
import { ProfileType } from '@/components/profile/types';

interface AdminUsersDialogsProps {
  editingUser: ProfileType | null;
  ratingUser: ProfileType | null;
  onEditDialogClose: () => void;
  onRatingDialogClose: () => void;
}

export const AdminUsersDialogs: React.FC<AdminUsersDialogsProps> = ({
  editingUser,
  ratingUser,
  onEditDialogClose,
  onRatingDialogClose
}) => {
  return (
    <>
      {editingUser && (
        <UserEditDialog
          user={editingUser}
          trigger={<div />}
          onSuccess={onEditDialogClose}
        />
      )}
      
      {ratingUser && (
        <UserRatingDialog
          user={ratingUser}
          trigger={<div />}
          onSuccess={onRatingDialogClose}
        />
      )}
    </>
  );
};
