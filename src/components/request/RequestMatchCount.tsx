
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface RequestMatchCountProps {
  requestTitle: string;
  requestBrand?: string;
  requestModel?: string;
}

/**
 * Component that displays the number of matching products in the catalog
 */
export const RequestMatchCount: React.FC<RequestMatchCountProps> = ({ 
  requestTitle, 
  requestBrand, 
  requestModel 
}) => {
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMatchCount = async () => {
      if (!requestTitle) {
        setMatchCount(0);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Normalize text for comparison
        const normalizedRequestTitle = requestTitle.trim().toLowerCase();
        const normalizedRequestBrand = requestBrand ? requestBrand.trim().toLowerCase() : null;
        const normalizedRequestModel = requestModel ? requestModel.trim().toLowerCase() : null;

        // Build the query based on available criteria
        let query = supabase
          .from("products")
          .select("id")
          .eq('status', 'active');

        // Add title search
        query = query.or(`title.ilike.%${normalizedRequestTitle}%`);

        // Add brand filter if available
        if (normalizedRequestBrand) {
          query = query.eq('brand', normalizedRequestBrand);
        }

        // Add model filter if available
        if (normalizedRequestModel) {
          query = query.eq('model', normalizedRequestModel);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching match count:", error);
          setMatchCount(0);
        } else {
          setMatchCount(data.length);
        }
      } catch (err) {
        console.error("Error in fetchMatchCount:", err);
        setMatchCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchCount();
  }, [requestTitle, requestBrand, requestModel]);

  if (isLoading) {
    return <Badge variant="outline" className="animate-pulse">Поиск...</Badge>;
  }

  if (matchCount === 0) {
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Нет совпадений</Badge>;
  }

  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
      {matchCount} {matchCount === 1 ? 'совпадение' : 
                   (matchCount >= 2 && matchCount <= 4) ? 'совпадения' : 'совпадений'}
    </Badge>
  );
};

export default RequestMatchCount;
