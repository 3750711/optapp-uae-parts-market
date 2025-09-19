import React from "react";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TelegramViewsEstimateProps {
  estimate?: number;
  className?: string;
}

export const TelegramViewsEstimate: React.FC<TelegramViewsEstimateProps> = ({
  estimate,
  className = ""
}) => {
  if (estimate === undefined || estimate === null) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500" />
          Просмотры в Telegram (оценка)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">
            {estimate.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Оценка на основе модели; растёт постепенно в течение дня, может отличаться от реальных просмотров.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};