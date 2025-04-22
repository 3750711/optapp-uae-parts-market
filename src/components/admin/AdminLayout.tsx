
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AdminTopMenu from './AdminTopMenu';

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar className="bg-white border-r border-gray-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin'}
                tooltip="Дашборд"
                className="py-3"
              >
                <Link to="/admin" className="flex items-center w-full group transition-colors">
                  <LayoutDashboard className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-base">Дашборд</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/users'}
                tooltip="Пользователи"
                className="py-3"
              >
                <Link to="/admin/users" className="flex items-center w-full group transition-colors">
                  <Users className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-base">Пользователи</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/products'}
                tooltip="Товары"
                className="py-3"
              >
                <Link to="/admin/products" className="flex items-center w-full group transition-colors">
                  <Package className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-base">Товары</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/orders'}
                tooltip="Заказы"
                className="py-3"
              >
                <Link to="/admin/orders" className="flex items-center w-full group transition-colors">
                  <ShoppingCart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-base">Заказы</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/analytics'}
                tooltip="Аналитика"
                className="py-3"
              >
                <Link to="/admin/analytics" className="flex items-center w-full group transition-colors">
                  <BarChart className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-base">Аналитика</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-grow">
          <AdminTopMenu />
          <main className="p-4 md:p-6">
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
