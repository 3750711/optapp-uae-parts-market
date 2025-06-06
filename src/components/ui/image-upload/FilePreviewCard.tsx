
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Star, Cloud, RefreshCw } from "lucide-react";

interface FilePreviewCardProps {
  selectedFiles: File[];
  isUploading: boolean;
  onClearFiles: () => void;
  onStartUpload: () => void;
  formatFileSize: (bytes: number) => string;
}

export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  selectedFiles,
  isUploading,
  onClearFiles,
  onStartUpload,
  formatFileSize
}) => {
  if (selectedFiles.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Готово к загрузке в Cloudinary: {selectedFiles.length} файлов
            {selectedFiles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                <Star className="h-3 w-3 mr-1" />
                1-е = основное
              </Badge>
            )}
            <Badge variant="outline" className="ml-2">
              <Cloud className="h-3 w-3 mr-1" />
              400KB + 20KB превью
            </Badge>
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFiles}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <Star className="h-4 w-4 text-yellow-500" />
                )}
                <span className="truncate">{file.name}</span>
                <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                <Badge variant="outline" className="text-xs">
                  <Cloud className="h-3 w-3 mr-1" />
                  →400KB
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Button */}
        <Button
          onClick={onStartUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Загрузка в Cloudinary...
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              Загрузить {selectedFiles.length} файлов в Cloudinary
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
