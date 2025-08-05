import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface AdminTitleEditorProps {
  originalTitle: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

const AdminTitleEditor: React.FC<AdminTitleEditorProps> = ({
  originalTitle,
  value,
  onSave,
  placeholder = "Введите новое название товара",
  className
}) => {
  const [editedValue, setEditedValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editedValue !== value) {
      setIsSaving(true);
      try {
        await onSave(editedValue);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className={className}>
      {/* Original title - read only */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          📝 Оригинальное название от продавца:
        </label>
        <div className="text-sm leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap">
          {originalTitle}
        </div>
      </div>

      {/* New title - editable */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          ✏️ Новое название товара:
        </label>
        <Textarea
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className="min-h-[80px] max-h-[120px] overflow-y-auto resize-none text-sm leading-relaxed"
          rows={3}
        />
        {isSaving && (
          <p className="text-xs text-muted-foreground mt-1">Сохранение...</p>
        )}
      </div>
    </div>
  );
};

export default AdminTitleEditor;