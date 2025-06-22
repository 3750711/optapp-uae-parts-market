
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
import { useProfile } from "@/contexts/ProfileProvider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Header from "../layout/Header";

const AdminTopMenu = () => {
  const { profile } = useProfile();

  return (
    <Header />
  );
};

export default AdminTopMenu;
