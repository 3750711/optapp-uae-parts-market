
import React from "react";
import { Link } from "react-router-dom";
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Package, ShoppingCart, Store, MessageSquare, Info, Phone, ChevronDown } from "lucide-react";

const TopMenu = () => {
  return (
    <div className="border-b border-gray-100 bg-white py-2 hidden md:block">
      <div className="container mx-auto px-4 md:px-8">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm">Каталог</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Все товары</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog?category=engine" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Двигатель</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog?category=transmission" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Трансмиссия</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog?category=body" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Кузов</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog?category=electronic" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Электроника</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/catalog?category=suspension" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Подвеска</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm">Услуги</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/requests" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Запросы на запчасти</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link 
                        to="/requests/create" 
                        className="flex items-center gap-2 select-none space-y-1 rounded-md p-3 hover:bg-accent leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium">Создать новый запрос</div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/stores" className={cn(navigationMenuTriggerStyle(), "text-sm flex gap-1 items-center")}>
                <Store className="h-4 w-4" /> 
                <span>Магазины</span>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/about" className={cn(navigationMenuTriggerStyle(), "text-sm flex gap-1 items-center")}>
                <Info className="h-4 w-4" /> 
                <span>О нас</span>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/contact" className={cn(navigationMenuTriggerStyle(), "text-sm flex gap-1 items-center")}>
                <Phone className="h-4 w-4" /> 
                <span>Контакты</span>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default TopMenu;
