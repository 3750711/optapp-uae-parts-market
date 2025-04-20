
export type UserType = 'buyer' | 'seller' | 'admin';

export type ProfileType = Database["public"]["Tables"]["profiles"]["Row"] & {
  user_type: UserType;
};
