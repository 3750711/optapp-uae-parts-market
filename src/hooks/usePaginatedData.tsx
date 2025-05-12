
import { useMemo } from "react";

export interface PaginationOptions {
  pageSize: number;
  currentPage?: number;
}

export function usePaginatedData<T>(
  data: T[],
  options: PaginationOptions = { pageSize: 30, currentPage: 1 }
) {
  const { pageSize, currentPage = 1 } = options;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  // Create batched chunks for incremental rendering
  const dataChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < data.length; i += pageSize) {
      chunks.push(data.slice(i, i + pageSize));
    }
    return chunks;
  }, [data, pageSize]);

  return {
    paginatedData,
    totalPages,
    dataChunks,
    pageSize
  };
}
