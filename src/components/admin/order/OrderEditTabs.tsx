
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Image, Clock, FileText } from "lucide-react";
import { OrderBasicInfoTab } from './OrderBasicInfoTab';
import { OrderMediaTab } from './OrderMediaTab';
import { OrderHistoryTab } from './OrderHistoryTab';
import { OrderExportTab } from './OrderExportTab';

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
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Основная информация</span>
          <span className="sm:hidden">Основное</span>
        </TabsTrigger>
        <TabsTrigger value="media" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">Медиафайлы</span>
          <span className="sm:hidden">Медиа</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">История</span>
          <span className="sm:hidden">История</span>
        </TabsTrigger>
        <TabsTrigger value="export" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Экспорт</span>
          <span className="sm:hidden">Экспорт</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        <OrderBasicInfoTab form={form} order={order} />
      </TabsContent>

      <TabsContent value="media" className="mt-6">
        <OrderMediaTab
          order={order}
          orderImages={orderImages}
          orderVideos={orderVideos}
          onImagesUpload={onImagesUpload}
          onVideoUpload={onVideoUpload}
          onVideoDelete={onVideoDelete}
        />
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <OrderHistoryTab orderId={order?.id} />
      </TabsContent>

      <TabsContent value="export" className="mt-6">
        <OrderExportTab order={order} />
      </TabsContent>
    </Tabs>
  );
};
