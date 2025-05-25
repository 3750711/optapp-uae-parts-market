
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
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

export const OrderEditTabs: React.FC<OrderEditTabsProps> = ({
  order,
  form,
  orderImages,
  orderVideos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4 h-12' : 'grid-cols-4 h-10'}`}>
        <TabsTrigger 
          value="basic" 
          className={`flex items-center gap-2 ${isMobile ? 'px-2 py-3 text-xs' : 'px-3 py-2'}`}
        >
          <Package className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
          <span className={`${isMobile ? 'hidden xs:inline text-xs' : 'hidden sm:inline'}`}>
            Основная информация
          </span>
          <span className={`${isMobile ? 'xs:hidden' : 'sm:hidden'}`}>
            Основное
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="media" 
          className={`flex items-center gap-2 ${isMobile ? 'px-2 py-3 text-xs' : 'px-3 py-2'}`}
        >
          <Image className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
          <span className={`${isMobile ? 'hidden xs:inline text-xs' : 'hidden sm:inline'}`}>
            Медиафайлы
          </span>
          <span className={`${isMobile ? 'xs:hidden' : 'sm:hidden'}`}>
            Медиа
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className={`flex items-center gap-2 ${isMobile ? 'px-2 py-3 text-xs' : 'px-3 py-2'}`}
        >
          <Clock className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
          <span className={`${isMobile ? 'hidden xs:inline text-xs' : 'hidden sm:inline'}`}>
            История
          </span>
          <span className={`${isMobile ? 'xs:hidden' : 'sm:hidden'}`}>
            История
          </span>
        </TabsTrigger>
        <TabsTrigger 
          value="export" 
          className={`flex items-center gap-2 ${isMobile ? 'px-2 py-3 text-xs' : 'px-3 py-2'}`}
        >
          <FileText className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
          <span className={`${isMobile ? 'hidden xs:inline text-xs' : 'hidden sm:inline'}`}>
            Экспорт
          </span>
          <span className={`${isMobile ? 'xs:hidden' : 'sm:hidden'}`}>
            Экспорт
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
        <OrderBasicInfoTab form={form} order={order} />
      </TabsContent>

      <TabsContent value="media" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
        <OrderMediaTab
          order={order}
          orderImages={orderImages}
          orderVideos={orderVideos}
          onImagesUpload={onImagesUpload}
          onVideoUpload={onVideoUpload}
          onVideoDelete={onVideoDelete}
        />
      </TabsContent>

      <TabsContent value="history" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
        <OrderHistoryTab orderId={order?.id} />
      </TabsContent>

      <TabsContent value="export" className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
        <OrderExportTab order={order} />
      </TabsContent>
    </Tabs>
  );
};
