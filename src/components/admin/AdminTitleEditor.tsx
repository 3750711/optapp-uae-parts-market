import React from 'react';
import { InlineEditableTextarea } from '@/components/ui/InlineEditableTextarea';

interface AdminTitleEditorProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

const AdminTitleEditor: React.FC<AdminTitleEditorProps> = ({
  value,
  onSave,
  placeholder = "Название товара",
  className
}) => {
  return (
    <InlineEditableTextarea
      value={value}
      onSave={onSave}
      placeholder={placeholder}
      className={className}
      minRows={2}
      maxRows={4}
    />
  );
};

export default AdminTitleEditor;