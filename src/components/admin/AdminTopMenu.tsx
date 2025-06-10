
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
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Header from "../layout/Header";

const AdminTopMenu = () => {
  const { profile } = useAuth();

  return (
    <Header />
  );
};

export default AdminTopMenu;
