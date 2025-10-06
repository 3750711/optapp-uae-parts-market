import { Product } from '@/types/product';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { 
  isNotificationSent, 
  hasNotificationIssue, 
  isNotificationPending,
  getConfirmationDate,
  getNotificationIssueReason
} from '@/utils/notificationHelpers';
import { ResendProductNotificationButton } from './ResendProductNotificationButton';

interface TelegramNotificationBadgeProps {
  product: Product;
  className?: string;
}

export const TelegramNotificationBadge = ({ 
  product, 
  className = '' 
}: TelegramNotificationBadgeProps) => {
  const status = product.telegram_notification_status;

  // Не показываем ничего для not_sent
  if (!status || status === 'not_sent') {
    return null;
  }

  // Зелёная галочка - успешно отправлено
  if (isNotificationSent(product)) {
    const confirmDate = getConfirmationDate(product);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center ${className}`}>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Опубликовано в Telegram
              {confirmDate && <><br />{confirmDate}</>}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Красный крестик с кнопкой повторной отправки - ошибка
  if (hasNotificationIssue(product)) {
    const errorReason = getNotificationIssueReason(product);
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs whitespace-pre-wrap">{errorReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ResendProductNotificationButton productId={product.id} className="ml-1" />
      </div>
    );
  }

  // Жёлтый индикатор ожидания - pending
  if (isNotificationPending(product)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center justify-center ${className}`}>
              <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Ожидание подтверждения из Telegram</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};
