import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react';

interface UploadLog {
  id: string;
  created_at: string;
  user_id: string;
  product_id?: string;
  order_id?: string;
  file_url?: string;
  method: string;
  duration_ms?: number;
  status: 'success' | 'error';
  error_details?: string;
  trace_id?: string;
  original_size?: number;
  compressed_size?: number;
  compression_ratio?: number;
  context: 'free_order' | 'seller_product' | 'admin_product';
  step_name?: string;
  profiles?: {
    full_name: string;
    opt_id: string;
  };
}

interface Filters {
  context: string;
  status: string;
  method: string;
  userId: string;
  dateRange: string;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatDuration = (ms?: number) => {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatCompressionRatio = (ratio?: number) => {
  if (!ratio) return 'N/A';
  const percentage = ((1 - ratio) * 100).toFixed(1);
  return `${percentage}% saved`;
};

export const AdminSellerUploadMonitoring = () => {
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    context: 'all',
    status: 'all',
    method: 'all',
    userId: '',
    dateRange: '24h'
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 50,
    total: 0
  });
  const { toast } = useToast();

  const loadLogs = async (reset = false) => {
    try {
      setLoading(true);
      
      const offset = reset ? 0 : pagination.page * pagination.limit;
      let query = supabase
        .from('product_upload_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            opt_id
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      // Apply filters
      if (filters.context !== 'all') {
        query = query.eq('context', filters.context);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.method !== 'all') {
        query = query.eq('method', filters.method);
      }
      
      if (filters.userId.trim()) {
        query = query.ilike('profiles.opt_id', `%${filters.userId.trim()}%`);
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date(now);
        
        switch (filters.dateRange) {
          case '1h':
            startDate.setHours(now.getHours() - 1);
            break;
          case '24h':
            startDate.setDate(now.getDate() - 1);
            break;
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, count, error } = await query;
      
      if (error) {
        console.error('Error loading logs:', error);
        toast({
          title: "Error loading logs",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (reset) {
        setLogs(data || []);
        setPagination(prev => ({ ...prev, page: 0, total: count || 0 }));
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
        setPagination(prev => ({ ...prev, total: count || 0 }));
      }

    } catch (error) {
      console.error('Error in loadLogs:', error);
      toast({
        title: "Error",
        description: "Failed to load upload logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(true);
  }, [filters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const loadMore = () => {
    if (!loading && logs.length < pagination.total) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      loadLogs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const getContextBadge = (context: string) => {
    const colors = {
      'seller_product': 'bg-blue-100 text-blue-800',
      'admin_product': 'bg-purple-100 text-purple-800', 
      'free_order': 'bg-orange-100 text-orange-800'
    };
    return <Badge variant="outline" className={colors[context as keyof typeof colors] || ''}>{context}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Upload Monitoring - Seller Products
          </CardTitle>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.context} onValueChange={(value) => handleFilterChange('context', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contexts</SelectItem>
                <SelectItem value="seller_product">Seller Products</SelectItem>
                <SelectItem value="admin_product">Admin Products</SelectItem>
                <SelectItem value="free_order">Free Orders</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.method} onValueChange={(value) => handleFilterChange('method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cloudinary-upload">Cloudinary</SelectItem>
                <SelectItem value="fallback">Fallback</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="User ID (OPT_ID)"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />

            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} of {pagination.total} uploads
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadLogs(true)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size Before</TableHead>
                <TableHead>Size After</TableHead>
                <TableHead>Compression</TableHead>
                <TableHead>Trace ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{log.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{log.profiles?.opt_id || log.user_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getContextBadge(log.context)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.method}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="font-mono">{formatDuration(log.duration_ms)}</TableCell>
                  <TableCell className="font-mono">{formatFileSize(log.original_size)}</TableCell>
                  <TableCell className="font-mono">{formatFileSize(log.compressed_size)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatCompressionRatio(log.compression_ratio)}</TableCell>
                  <TableCell className="font-mono text-xs">{log.trace_id?.substring(0, 8) || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length < pagination.total && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : `Load More (${pagination.total - logs.length} remaining)`}
              </Button>
            </div>
          )}

          {logs.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No upload logs found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSellerUploadMonitoring;