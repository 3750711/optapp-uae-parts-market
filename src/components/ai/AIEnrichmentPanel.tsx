import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock } from 'lucide-react';
import { useAIEnrichment } from '@/hooks/useAIEnrichment';

interface AIEnrichmentPanelProps {
  title: string;
  brand?: string;
  model?: string;
  productId?: string;
  onApplyChanges: (changes: {
    title?: string;
    brand?: string;
    model?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}

const AIEnrichmentPanel: React.FC<AIEnrichmentPanelProps> = ({
  title,
  brand,
  model,
  productId,
  onApplyChanges,
  disabled = false,
  className
}) => {
  const { 
    enrichProduct, 
    isLoading, 
    result, 
    error,
    reset,
    hasResult,
  } = useAIEnrichment();

  const handleEnrich = async () => {
    if (!title.trim()) return;
    
    await enrichProduct({
      product_id: productId,
      title: title.trim(),
      brand,
      model
    });
  };

  const handleApplyChanges = () => {
    if (!result) return;
    
    const changes: { title?: string; brand?: string; model?: string } = {};
    if (result.title_ru !== title) {
      changes.title = result.title_ru;
    }
    if (result.brand && result.brand !== brand) {
      changes.brand = result.brand;
    }
    if (result.model && result.model !== model) {
      changes.model = result.model;
    }
    
    onApplyChanges(changes);
    reset();
  };

  return (
    <div className={className}>
      {!hasResult && !error && (
        <Button 
          onClick={handleEnrich}
          disabled={disabled || isLoading || !title.trim()}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              AI обработка...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI обработка
            </>
          )}
        </Button>
      )}

      {error && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={reset}
        >
          Попробовать снова
        </Button>
      )}

      {hasResult && (
        <div className="flex gap-2">
          <Button 
            onClick={handleApplyChanges}
            size="sm"
            variant="default"
          >
            Применить
          </Button>
          <Button 
            variant="outline" 
            onClick={reset}
            size="sm"
          >
            Отклонить
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIEnrichmentPanel;