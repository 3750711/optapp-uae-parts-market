import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Shield, Star, Crown, User } from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  telegram?: string;
  user_type: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'verified' | 'blocked';
  opt_status: 'free_user' | 'opt_user';
}

export const useRecipientSelection = () => {
  const [selectedRecipients, setSelectedRecipients] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const predefinedGroups = [
    { value: 'all_users', label: 'Все пользователи', icon: Users },
    { value: 'sellers', label: 'Продавцы', icon: User },
    { value: 'buyers', label: 'Покупатели', icon: UserCheck },
    { value: 'verified_users', label: 'Верифицированные', icon: Shield },
    { value: 'opt_users', label: 'OPT пользователи', icon: Star },
    { value: 'pending_users', label: 'На модерации', icon: Crown },
  ];

  // Search users when debounced query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, telegram, user_type, verification_status, opt_status')
          .or(`full_name.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%,telegram.ilike.%${debouncedSearchQuery}%`)
          .limit(20);

        if (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
        }
      } catch (error) {
        console.error('Error in user search:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);

  const selectUser = (user: UserProfile) => {
    if (!selectedRecipients.find(r => r.id === user.id)) {
      setSelectedRecipients(prev => [...prev, user]);
    }
    // Clear group selection when individual users are selected
    setSelectedGroup(null);
  };

  const deselectUser = (userId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== userId));
  };

  const selectGroup = (groupValue: string) => {
    // Clear individual selections when group is selected
    setSelectedRecipients([]);
    setSelectedGroup(prev => prev === groupValue ? null : groupValue);
  };

  const clearSelection = () => {
    setSelectedRecipients([]);
    setSelectedGroup(null);
  };

  const getSelectionSummary = () => {
    if (selectedGroup) {
      const group = predefinedGroups.find(g => g.value === selectedGroup);
      return group?.label || selectedGroup;
    }
    
    if (selectedRecipients.length === 0) {
      return 'Не выбраны';
    }
    
    if (selectedRecipients.length === 1) {
      return selectedRecipients[0].full_name || selectedRecipients[0].email;
    }
    
    return `${selectedRecipients.length} пользователей`;
  };

  return {
    selectedRecipients,
    searchQuery,
    searchResults,
    isSearching,
    predefinedGroups,
    selectedGroup,
    setSearchQuery,
    selectUser,
    deselectUser,
    selectGroup,
    clearSelection,
    getSelectionSummary
  };
};