import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Activity, Bot, Brain, BarChart3 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import TelegramAccountsManager from '@/components/admin/TelegramAccountsManager';
import AIPromptEditor from '@/components/admin/AIPromptEditor';
import { AITranslationRulesManager } from '@/components/admin/AITranslationRulesManager';
import { AICorrectionAnalysis } from '@/components/admin/AICorrectionAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminSettings: React.FC = () => {
  const [telegramManagerOpen, setTelegramManagerOpen] = useState(false);
  const [aiPromptEditorOpen, setAiPromptEditorOpen] = useState(false);
  const [aiRulesManagerOpen, setAiRulesManagerOpen] = useState(false);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">
            Настройки администратора
          </h1>
          
          <Button
            onClick={() => setTelegramManagerOpen(true)}
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target"
          >
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                Отражения телеграмов продавцев
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Выбор продавцов, чьи телеграм аккаунты показывать в телеграм оповещениях
              </p>
            </div>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <a href="/admin/activity-monitor">
              <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">
                  Мониторинг активности пользователей
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Входы, действия, ошибки по пользователям
                </p>
              </div>
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <a href="/admin/monitoring/free-order-upload">
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">
                  Мониторинг загрузки фото в свободном заказе
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Просмотр логов и статистики загрузки фотографий
                </p>
              </div>
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <a href="/admin/monitoring/seller-upload">
              <BarChart3 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">
                  Мониторинг загрузки фото продавцами
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Универсальный мониторинг загрузок с фильтрацией по контексту
                </p>
              </div>
            </a>
          </Button>

          <Button
            onClick={() => setAiPromptEditorOpen(true)}
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                Настройка промта для ИИ-обработки товаров
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Редактирование основного промта для обогащения товаров с помощью ИИ
              </p>
            </div>
          </Button>

          <Button
            onClick={() => setAiRulesManagerOpen(true)}
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                Управление правилами перевода ИИ
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Создание и управление правилами для обучения ИИ на исправлениях
              </p>
            </div>
          </Button>

          <Button
            onClick={() => setAiAnalysisOpen(true)}
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target mt-4"
          >
            <BarChart3 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                Анализ исправлений ИИ
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Просмотр извлеченных правил и статистики обучения ИИ
              </p>
            </div>
          </Button>
        </div>
      </div>

      <TelegramAccountsManager 
        open={telegramManagerOpen}
        onClose={() => setTelegramManagerOpen(false)}
      />

      <AIPromptEditor 
        open={aiPromptEditorOpen}
        onClose={() => setAiPromptEditorOpen(false)}
      />

      <Dialog open={aiRulesManagerOpen} onOpenChange={setAiRulesManagerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Управление правилами перевода ИИ</DialogTitle>
          </DialogHeader>
          <AITranslationRulesManager />
        </DialogContent>
      </Dialog>

      <Dialog open={aiAnalysisOpen} onOpenChange={setAiAnalysisOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Анализ исправлений ИИ</DialogTitle>
          </DialogHeader>
          <AICorrectionAnalysis />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSettings;