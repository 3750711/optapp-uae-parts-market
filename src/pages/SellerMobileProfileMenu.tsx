import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  LogOut, 
  Package, 
  Plus, 
  Settings, 
  Store, 
  MessageSquare,
  Bell,
  Heart,
  HelpCircle,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useFavorites } from '@/hooks/useFavorites';

const SellerMobileProfileMenu = () => {
  const { user, signOut, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have successfully signed out"
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate('/seller/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Profile</h1>
        <div className="w-10" />
      </div>

      {/* Profile Section */}
      <div className="p-6 bg-accent/10">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={user.user_metadata?.avatar_url || ''} 
              alt={user.user_metadata?.full_name || 'User'} 
            />
            <AvatarFallback className="bg-primary text-white text-2xl">
              {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {user.user_metadata?.full_name || 'User'}
            </h2>
            {profile.opt_id && (
              <p className="text-sm text-muted-foreground">
                OPT ID: {profile.opt_id}
              </p>
            )}
            {profile.telegram && (
              <p className="text-sm text-muted-foreground">
                @{profile.telegram.replace('@', '')}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {/* Profile Settings */}
        <Link to="/profile">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Settings className="mr-3 h-5 w-5" />
            Profile Settings
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Universal Items */}
        <Link to="/notifications">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Bell className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        <Link to="/favorites">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Heart className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">Favorites</span>
            {favorites.length > 0 && (
              <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-0">
                {favorites.length > 99 ? '99+' : favorites.length}
              </Badge>
            )}
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Seller-specific Items */}
        <Link to="/seller/dashboard">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Store className="mr-3 h-5 w-5" />
            Seller Dashboard
          </Button>
        </Link>
        
        <Link to="/seller/listings">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Package className="mr-3 h-5 w-5" />
            My Products
          </Button>
        </Link>
        
        <Link to="/seller/add-product">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Plus className="mr-3 h-5 w-5" />
            Add Product
          </Button>
        </Link>
        
        <Link to="/seller/orders">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <ClipboardList className="mr-3 h-5 w-5" />
            My Orders
          </Button>
        </Link>
        
        <Link to="/seller/price-offers">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <DollarSign className="mr-3 h-5 w-5" />
            Price Offers
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Help */}
        <Link to="/help">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <HelpCircle className="mr-3 h-5 w-5" />
            Help
          </Button>
        </Link>

        <Separator className="my-4" />
        
        {/* Logout */}
        <Button 
          onClick={handleLogout} 
          variant="ghost" 
          className="w-full justify-start h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default SellerMobileProfileMenu;