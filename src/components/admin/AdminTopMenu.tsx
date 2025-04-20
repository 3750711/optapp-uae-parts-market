
import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Bell, Mail, Settings, User, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

const AdminTopMenu = () => {
  const { profile } = useAuth();

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-xl md:text-2xl font-bold text-optapp-dark truncate">Панель администратора</h2>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Menubar className="border-none">
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                <Bell className="h-5 w-5 text-gray-500" />
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem className="text-sm">Новые заказы</MenubarItem>
                <MenubarItem className="text-sm">Новые пользователи</MenubarItem>
                <MenubarSeparator />
                <MenubarItem className="text-sm">Все уведомления</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer hidden md:flex">
                <Mail className="h-5 w-5 text-gray-500" />
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem className="text-sm">Входящие</MenubarItem>
                <MenubarItem className="text-sm">Отправленные</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-optapp-yellow text-optapp-dark">
                    {profile?.full_name?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem className="flex items-center text-sm">
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </MenubarItem>
                <MenubarItem className="flex items-center text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Настройки</span>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </div>
    </div>
  );
};

export default AdminTopMenu;
