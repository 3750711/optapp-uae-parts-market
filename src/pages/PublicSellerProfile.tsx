import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Store } from 'lucide-react';

const PublicSellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: sellerProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['publicSellerProfile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching seller profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['sellerStore', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('seller_id', id)
        .single();

      if (error) {
        console.error('Error fetching seller store:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Implement follow/unfollow logic here
  };

  if (isProfileLoading || isStoreLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!sellerProfile || !store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Профиль не найден</CardTitle>
              <CardDescription>Пользователь или магазин не существуют</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={sellerProfile.avatar_url} />
                <AvatarFallback>{sellerProfile.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{sellerProfile.full_name}</CardTitle>
                <CardDescription>{store.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <span>Магазин:</span>
                <Link to={`/store/${store.id}`} className="underline">
                  {store.name}
                </Link>
              </div>
              <div>
                <span>Адрес:</span>
                <p>{store.address}</p>
              </div>
              <div>
                <span>Телефон:</span>
                <p>{store.phone}</p>
              </div>
              {user && user.id !== sellerProfile.id && (
                <Button onClick={handleFollow}>
                  {isFollowing ? 'Отписаться' : 'Подписаться'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PublicSellerProfile;
