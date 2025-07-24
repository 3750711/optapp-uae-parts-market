
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Image, Clock, FileText } from "lucide-react";
import { OrderBasicInfoTab } from './OrderBasicInfoTab';
import { OrderMediaTab } from './OrderMediaTab';
import { OrderHistoryTab } from './OrderHistoryTab';
import { OrderExportTab } from './OrderExportTab';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderEditTabsProps {
  order: any;
  form: any;
  orderImages: string[];
  orderVideos: string[];
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
}

export const OrderEditTabs: React.FC<OrderEditTabsProps> = ({
  order,
  form,
  orderImages,
  orderVideos,
  onImagesChange,
  onVideosChange,
  onVideoDelete,
  onStatusChange
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-12 md:h-10 mb-4 md:mb-6">
        <TabsTrigger 
          value="basic" 
          className="flex items-center gap-1 md:gap-2 px-2 py-3 md:py-2 text-xs md:text-sm"
        >
          <Package className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">
            Основная информация
          </span>
          <span className="sm:hidden">
            Основное
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="media" 
          className="flex items-center gap-1 md:gap-2 px-2 py-3 md:py-2 text-xs md:text-sm"
        >
          <Image className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">
            Медиафайлы
          </span>
          <span className="sm:hidden">
            Медиа
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="flex items-center gap-1 md:gap-2 px-2 py-3 md:py-2 text-xs md:text-sm"
        >
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">
            История
          </span>
          <span className="sm:hidden">
            История
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="export" 
          className="flex items-center gap-1 md:gap-2 px-2 py-3 md:py-2 text-xs md:text-sm"
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">
            Экспорт
          </span>
          <span className="sm:hidden">
            Экспорт
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-0">
        <OrderBasicInfoTab form={form} order={order} onStatusChange={onStatusChange} />
      </TabsContent>

      <TabsContent value="media" className="mt-0">
        <OrderMediaTab
          order={order}
          orderImages={orderImages}
          orderVideos={orderVideos}
          onImagesChange={onImagesChange}
          onVideosChange={onVideosChange}
          onVideoDelete={onVideoDelete}
        />
      </TabsContent>

      <TabsContent value="history" className="mt-0">
        <OrderHistoryTab orderId={order?.id} />
      </TabsContent>

      <TabsContent value="export" className="mt-0">
        <OrderExportTab order={order} />
      </TabsContent>
    </Tabs>
  );
};
