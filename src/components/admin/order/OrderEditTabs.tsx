
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
}

export const OrderEditTabs: React.FC<OrderEditTabsProps> = ({
  order,
  form,
  orderImages,
  orderVideos,
  onImagesChange,
  onVideosChange,
  onVideoDelete
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className={`
        grid w-full grid-cols-4
        ${isMobile ? 'h-14 mb-4' : 'h-10 mb-6'}
      `}>
        <TabsTrigger 
          value="basic" 
          className={`
            flex items-center gap-2
            ${isMobile ? 'px-3 py-3 text-sm flex-col' : 'px-3 py-2'}
          `}
        >
          <Package className="h-4 w-4" />
          <span className={isMobile ? 'text-xs leading-tight' : 'hidden sm:inline'}>
            {isMobile ? 'Основная' : 'Основная информация'}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="media" 
          className={`
            flex items-center gap-2
            ${isMobile ? 'px-3 py-3 text-sm flex-col' : 'px-3 py-2'}
          `}
        >
          <Image className="h-4 w-4" />
          <span className={isMobile ? 'text-xs leading-tight' : 'hidden sm:inline'}>
            {isMobile ? 'Медиа' : 'Медиафайлы'}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="history" 
          className={`
            flex items-center gap-2
            ${isMobile ? 'px-3 py-3 text-sm flex-col' : 'px-3 py-2'}
          `}
        >
          <Clock className="h-4 w-4" />
          <span className={isMobile ? 'text-xs leading-tight' : 'hidden sm:inline'}>
            История
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="export" 
          className={`
            flex items-center gap-2
            ${isMobile ? 'px-3 py-3 text-sm flex-col' : 'px-3 py-2'}
          `}
        >
          <FileText className="h-4 w-4" />
          <span className={isMobile ? 'text-xs leading-tight' : 'hidden sm:inline'}>
            Экспорт
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className={isMobile ? 'mt-0' : 'mt-6'}>
        <OrderBasicInfoTab form={form} order={order} />
      </TabsContent>

      <TabsContent value="media" className={isMobile ? 'mt-0' : 'mt-6'}>
        <OrderMediaTab
          order={order}
          orderImages={orderImages}
          orderVideos={orderVideos}
          onImagesChange={onImagesChange}
          onVideosChange={onVideosChange}
          onVideoDelete={onVideoDelete}
        />
      </TabsContent>

      <TabsContent value="history" className={isMobile ? 'mt-0' : 'mt-6'}>
        <OrderHistoryTab orderId={order?.id} />
      </TabsContent>

      <TabsContent value="export" className={isMobile ? 'mt-0' : 'mt-6'}>
        <OrderExportTab order={order} />
      </TabsContent>
    </Tabs>
  );
};
