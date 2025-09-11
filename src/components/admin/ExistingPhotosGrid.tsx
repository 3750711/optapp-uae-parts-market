import React from "react";

interface ExistingPhotosGridProps {
  urls: string[];
  title?: string;
}

export const ExistingPhotosGrid: React.FC<ExistingPhotosGridProps> = ({ 
  urls, 
  title = "Existing Photos" 
}) => {
  if (urls.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {urls.map((url, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-border bg-card overflow-hidden"
          >
            <img
              src={url}
              alt={`Existing photo ${index + 1}`}
              loading="lazy"
              className="w-full aspect-square object-contain bg-muted"
            />
            <div className="absolute top-1 right-1">
              <div className="px-2 py-1 rounded-md text-xs bg-green-500 text-white">
                Saved
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};