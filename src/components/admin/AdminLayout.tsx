
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider 
} from "@/components/ui/sidebar";
import { Users, Package, ShoppingCart, BarChart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/users'}
                tooltip="Пользователи"
              >
                <Link to="/admin/users" className="flex items-center w-full group transition-colors">
                  <Users className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Пользователи</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/products'}
                tooltip="Товары"
              >
                <Link to="/admin/products" className="flex items-center w-full group transition-colors">
                  <Package className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Товары</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/orders'}
                tooltip="Заказы"
              >
                <Link to="/admin/orders" className="flex items-center w-full group transition-colors">
                  <ShoppingCart className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Заказы</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/analytics'}
                tooltip="Аналитика"
              >
                <Link to="/admin/analytics" className="flex items-center w-full group transition-colors">
                  <BarChart className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>Аналитика</span>
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
        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
