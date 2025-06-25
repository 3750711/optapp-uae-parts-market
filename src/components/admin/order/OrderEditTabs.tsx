
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <Tabs defaultValue="basic" className="w-full h-full flex flex-col">
      {/* Sticky Tab Headers */}
      <div className="flex-shrink-0 sticky top-0 bg-slate-50 z-10 pb-2">
        <TabsList className={`
          grid w-full grid-cols-4
          ${isMobile ? 'h-14 mb-2' : 'h-10 mb-4'}
        `}>
          <TabsTrigger 
            value="basic" 
            className={`
              flex items-center gap-2
              ${isMobile ? 'px-2 py-3 text-sm flex-col' : 'px-3 py-2'}
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
              ${isMobile ? 'px-2 py-3 text-sm flex-col' : 'px-3 py-2'}
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
              ${isMobile ? 'px-2 py-3 text-sm flex-col' : 'px-3 py-2'}
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
              ${isMobile ? 'px-2 py-3 text-sm flex-col' : 'px-3 py-2'}
            `}
          >
            <FileText className="h-4 w-4" />
            <span className={isMobile ? 'text-xs leading-tight' : 'hidden sm:inline'}>
              Экспорт
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 min-h-0">
        <TabsContent value="basic" className="mt-0 h-full">
          <ScrollArea className="h-full pr-4" style={{ touchAction: 'pan-y' }}>
            <div className="pb-4">
              <OrderBasicInfoTab form={form} order={order} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="media" className="mt-0 h-full">
          <ScrollArea className="h-full pr-4" style={{ touchAction: 'pan-y' }}>
            <div className="pb-4">
              <OrderMediaTab
                order={order}
                orderImages={orderImages}
                orderVideos={orderVideos}
                onImagesChange={onImagesChange}
                onVideosChange={onVideosChange}
                onVideoDelete={onVideoDelete}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="mt-0 h-full">
          <ScrollArea className="h-full pr-4" style={{ touchAction: 'pan-y' }}>
            <div className="pb-4">
              <OrderHistoryTab orderId={order?.id} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="export" className="mt-0 h-full">
          <ScrollArea className="h-full pr-4" style={{ touchAction: 'pan-y' }}>
            <div className="pb-4">
              <OrderExportTab order={order} />
            </div>
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
};
