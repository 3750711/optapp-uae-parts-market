
import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Bell, Mail, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const AdminTopMenu = () => {
  const { profile } = useAuth();

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-4 justify-between">
        <h2 className="text-2xl font-bold text-optapp-dark">Панель администратора</h2>
        
        <div className="flex items-center gap-4">
          <Menubar className="border-none">
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                <Bell className="h-5 w-5 text-gray-500" />
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Новые заказы</MenubarItem>
                <MenubarItem>Новые пользователи</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Все уведомления</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">
                <Mail className="h-5 w-5 text-gray-500" />
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Входящие</MenubarItem>
                <MenubarItem>Отправленные</MenubarItem>
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
                <MenubarItem className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Профиль</span>
                </MenubarItem>
                <MenubarItem className="flex items-center">
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
