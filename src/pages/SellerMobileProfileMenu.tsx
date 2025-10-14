import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthWithProfile } from '@/hooks/useAuthWithProfile';
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
  Globe,
  HelpCircle,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/hooks/useLanguage';
import { allowedLocalesFor } from '@/utils/languageVisibility';
import LanguageToggle from '@/components/auth/LanguageToggle';
import { getProfileMenuTranslations } from '@/utils/translations/profileMenuPages';

const SellerMobileProfileMenu = () => {
  const { user, signOut, profile, isLoading } = useAuthWithProfile();
  const { unreadCount } = useNotifications();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = getProfileMenuTranslations(language);

  // Get allowed languages for seller
  const allowedLanguages = allowedLocalesFor(profile?.user_type || null, '/seller/profile-menu');

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t.signedOut,
        description: t.signedOutDescription
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

  // Show loading state instead of returning null
  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with PWA safe-area support */}
      <div className="pwa-safe-sticky-top flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => navigate('/seller/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{t.profileSettings}</h1>
        <div className="w-10" />
      </div>

      {/* Profile Section */}
      <div className="pt-2 p-6 bg-accent/10">
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
            {profile?.opt_id && (
              <p className="text-sm text-muted-foreground">
                {t.optId}: {profile.opt_id}
              </p>
            )}
            {profile?.telegram && (
              <p className="text-sm text-muted-foreground">
                {t.telegram}: @{profile.telegram.replace('@', '')}
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
            {t.profileSettings}
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Language Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-base font-medium">{t.language}</span>
            </div>
          </div>
          <div className="px-3">
            <LanguageToggle
              language={language}
              onLanguageChange={changeLanguage}
              allowedLanguages={allowedLanguages}
              className="w-full justify-center"
            />
          </div>
        </div>

        <Separator className="my-4" />
        <Link to="/notifications">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Bell className="mr-3 h-5 w-5" />
            <span className="flex-1 text-left">{t.notifications}</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>


        <Separator className="my-4" />

        {/* Seller-specific Items */}
        <Link to="/seller/dashboard">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Store className="mr-3 h-5 w-5" />
            {t.sellerDashboard}
          </Button>
        </Link>
        
        <Link to="/seller/listings">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Package className="mr-3 h-5 w-5" />
            {t.myProducts}
          </Button>
        </Link>
        
        <Link to="/seller/add-product">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <Plus className="mr-3 h-5 w-5" />
            {t.addProduct}
          </Button>
        </Link>
        
        <Link to="/seller/orders">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <ClipboardList className="mr-3 h-5 w-5" />
            {t.myOrders}
          </Button>
        </Link>
        
        <Link to="/seller/price-offers">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <DollarSign className="mr-3 h-5 w-5" />
            {t.priceOffers}
          </Button>
        </Link>

        <Separator className="my-4" />

        {/* Help */}
        <Link to="/help">
          <Button variant="ghost" className="w-full justify-start h-12 text-base">
            <HelpCircle className="mr-3 h-5 w-5" />
            {t.help}
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
          {t.signOut}
        </Button>
      </div>
    </div>
  );
};

export default SellerMobileProfileMenu;