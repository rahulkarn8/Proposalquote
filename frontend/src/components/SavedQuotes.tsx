import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listQuotes, getQuote } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { QuoteSummary, QuoteConfiguration } from '@/types';
import { FileText, RefreshCw } from 'lucide-react';

interface SavedQuotesProps {
  onLoadQuote: (
    config: QuoteConfiguration,
    quoteId: string,
    meta?: { quoteNumber?: string; status?: string }
  ) => void;
}

export function SavedQuotes({ onLoadQuote }: SavedQuotesProps) {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const data = await listQuotes();
      setQuotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleLoad = async (id: string) => {
    try {
      const data = await getQuote(id);
      onLoadQuote(data.config, id, {
        quoteNumber: data.quote.quoteNumber,
        status: data.quote.status,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'FINAL': return 'default' as const;
      case 'EXPIRED': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Saved Quotes
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={fetchQuotes} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">No saved quotes yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {quotes.map((q) => (
              <button
                key={q.id}
                onClick={() => handleLoad(q.id)}
                className="w-full text-left p-3 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{q.quoteNumber}</span>
                  <Badge variant={statusColor(q.status)}>{q.status}</Badge>
                </div>
                <div className="flex justify-between mt-1 text-xs text-[var(--color-muted-foreground)]">
                  <span>{formatCurrency(q.totalPrice, q.currency)}</span>
                  <span>{formatDate(q.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
