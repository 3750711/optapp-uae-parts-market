
import React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, Package, ShoppingCart, BarChart, Shield } from 'lucide-react';
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
              >
                <Link to="/admin/users" className="flex items-center w-full">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Пользователи</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/products'}
              >
                <Link to="/admin/products" className="flex items-center w-full">
                  <Package className="mr-2 h-4 w-4" />
                  <span>Товары</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/orders'}
              >
                <Link to="/admin/orders" className="flex items-center w-full">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Заказы</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                isActive={location.pathname === '/admin/analytics'}
              >
                <Link to="/admin/analytics" className="flex items-center w-full">
                  <BarChart className="mr-2 h-4 w-4" />
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
    <div className="flex">
      <AdminSidebar />
      <main className="flex-grow p-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
