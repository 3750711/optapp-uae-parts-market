import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  MessageSquare,
  Settings,
  Database,
  Calendar,
  Truck,
  Car,
  DollarSign,
  Shield,
  Send,
  HelpCircle,
  Hash,
  Plus
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const adminMenuItems = [
  {
    title: 'Дашборд',
    url: '/admin',
    icon: LayoutDashboard,
    group: 'main'
  },
  {
    title: 'Создать заказ',
    url: '/admin/free-order',
    icon: Plus,
    group: 'orders'
  },
  {
    title: 'Заказы',
    url: '/admin/orders',
    icon: ShoppingCart,
    group: 'orders'
  },
  {
    title: 'Создать из товара',
    url: '/admin/create-order-from-product',
    icon: Package,
    group: 'orders'
  },
  {
    title: 'Продать товар',
    url: '/admin/sell-product',
    icon: DollarSign,
    group: 'orders'
  },
  {
    title: 'Товары',
    url: '/admin/products',
    icon: Package,
    group: 'catalog'
  },
  {
    title: 'Добавить товар',
    url: '/admin/add-product',
    icon: Plus,
    group: 'catalog'
  },
  {
    title: 'Модерация',
    url: '/admin/product-moderation',
    icon: Shield,
    group: 'catalog'
  },
  {
    title: 'Пользователи',
    url: '/admin/users',
    icon: Users,
    group: 'management'
  },
  {
    title: 'Магазины',
    url: '/admin/stores',
    icon: Store,
    group: 'management'
  },
  {
    title: 'Оптимиз. магазины',
    url: '/admin/optimized-stores',
    icon: Database,
    group: 'management'
  },
  {
    title: 'События',
    url: '/admin/events',
    icon: Calendar,
    group: 'system'
  },
  {
    title: 'Логистика',
    url: '/admin/logistics',
    icon: Truck,
    group: 'system'
  },
  {
    title: 'Каталог авто',
    url: '/admin/car-catalog',
    icon: Car,
    group: 'system'
  },
  {
    title: 'Сообщения',
    url: '/admin/messages',
    icon: MessageSquare,
    group: 'communication'
  },
  {
    title: 'Ценовые предложения',
    url: '/admin/price-offers',
    icon: DollarSign,
    group: 'communication'
  },
  {
    title: 'Telegram мониторинг',
    url: '/admin/telegram-monitoring',
    icon: Send,
    group: 'communication'
  },
  {
    title: 'Справка',
    url: '/admin/help-editor',
    icon: HelpCircle,
    group: 'settings'
  },
  {
    title: 'Синонимы',
    url: '/admin/synonyms',
    icon: Hash,
    group: 'settings'
  }
];

const groupLabels = {
  main: 'Основное',
  orders: 'Заказы',
  catalog: 'Каталог',
  management: 'Управление',
  system: 'Система',
  communication: 'Коммуникации',
  settings: 'Настройки'
};

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === 'collapsed';

  const getNavClassName = (path: string) => {
    const isActive = currentPath === path || (path !== '/admin' && currentPath.startsWith(path));
    return isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  const groupedItems = adminMenuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof adminMenuItems>);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupKey, items]) => (
          <SidebarGroup key={groupKey}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {groupLabels[groupKey as keyof typeof groupLabels]}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url)}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="ml-3 truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}