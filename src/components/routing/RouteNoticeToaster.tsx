import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function RouteNoticeToaster() {
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const notice = (location.state as any)?.notice;
    if (!notice) return;

    if (notice === 'blocked') {
      toast({
        title: 'Доступ ограничён',
        description: 'Ваш аккаунт заблокирован. Вы можете только просматривать сайт.',
        variant: 'destructive',
      });
    }

    // очищаем state, чтобы тост не повторялся при каждом рендере
    if (history.replaceState) {
      history.replaceState({}, document.title, location.pathname + location.search);
    }
  }, [location.key, toast]);

  return null;
}