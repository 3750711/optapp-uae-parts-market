import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  MoreVertical,
  MessageSquare,
  Eye,
  DollarSign,
  Calendar
} from "lucide-react";
import { PriceOffer } from "@/types/price-offer";
import { useNavigate } from "react-router-dom";

interface EnhancedSellerOffersProps {
  productId: string;
}

const EnhancedSellerOffers: React.FC<EnhancedSellerOffersProps> = ({ productId }) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  // Fetch offers data
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['product-offers', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          buyer_profile:profiles!price_offers_buyer_id_fkey(
            id,
            full_name,
            opt_id,
            rating,
            avatar_url
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (PriceOffer & { buyer_profile: any })[];
    },
  });

  const filteredOffers = offers.filter(offer => 
    filterStatus === 'all' || offer.status === filterStatus
  );

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    avgPrice: offers.length > 0 
      ? Math.round(offers.reduce((sum, o) => sum + o.offered_price, 0) / offers.length)
      : 0,
    maxPrice: offers.length > 0 
      ? Math.max(...offers.map(o => o.offered_price))
      : 0
  };

  const handleViewAllOffers = () => {
    navigate(`/seller/product/${productId}/offers`);
  };

  const handleQuickAction = (offerId: string, action: 'accept' | 'reject') => {
    // Реализация быстрых действий
    console.log(`${action} offer ${offerId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} дн. назад`;
    if (diffHours > 0) return `${diffHours} ч. назад`;
    return 'Только что';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Принято';
      case 'rejected': return 'Отклонено';
      case 'pending': return 'Ожидает';
      case 'expired': return 'Истекло';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Предложения покупателей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Предложения покупателей ({stats.total})
          </CardTitle>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтр
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  Все предложения
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                  Ожидающие
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('accepted')}>
                  Принятые
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>
                  Отклоненные
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="default" size="sm" onClick={handleViewAllOffers}>
              <Eye className="h-4 w-4 mr-2" />
              Все предложения
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Ожидают</span>
            </div>
            <div className="text-xl font-bold">{stats.pending}</div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Приняты</span>
            </div>
            <div className="text-xl font-bold">{stats.accepted}</div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Средняя цена</span>
            </div>
            <div className="text-xl font-bold">
              {stats.avgPrice > 0 ? `${stats.avgPrice.toLocaleString()} ₽` : '—'}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Макс. цена</span>
            </div>
            <div className="text-xl font-bold">
              {stats.maxPrice > 0 ? `${stats.maxPrice.toLocaleString()} ₽` : '—'}
            </div>
          </div>
        </div>

        {/* Offers List */}
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Ожидают ({stats.pending})</TabsTrigger>
            <TabsTrigger value="accepted">Приняты ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Отклонены ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-4">
            {filteredOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет предложений в этой категории</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOffers.slice(0, 5).map((offer) => (
                  <Card key={offer.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {offer.buyer_profile?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {offer.buyer_profile?.full_name || 'Покупатель'}
                            </span>
                            {offer.buyer_profile?.opt_id && (
                              <Badge variant="outline" className="text-xs">
                                {offer.buyer_profile.opt_id}
                              </Badge>
                            )}
                            {getStatusIcon(offer.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatTimeAgo(offer.created_at)}
                            </span>
                            
                            <span>Способ доставки: {
                              offer.delivery_method === 'self_pickup' ? 'Самовывоз' :
                              offer.delivery_method === 'cargo_rf' ? 'Карго РФ' : 'Карго КЗ'
                            }</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {offer.offered_price.toLocaleString('ru-RU')} ₽
                          </div>
                          <Badge variant="outline">
                            {getStatusText(offer.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="ml-4 flex items-center gap-2">
                        {offer.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleQuickAction(offer.id, 'accept')}
                            >
                              Принять
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleQuickAction(offer.id, 'reject')}
                            >
                              Отклонить
                            </Button>
                          </>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Написать сообщение
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Посмотреть профиль
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {offer.message && (
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{offer.message}</p>
                      </div>
                    )}
                  </Card>
                ))}
                
                {filteredOffers.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={handleViewAllOffers}>
                      Показать все {filteredOffers.length} предложений
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedSellerOffers;