'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../common/table';
import { Button } from '../../common/button';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  HelpCircle,
  Target,
} from 'lucide-react';
import { LabNamedCall } from './types';

/**
 * Named Calls Table Component
 *
 * Displays a paginated table of named calls with their performance metrics,
 * optimization status, and benchmarking recommendations for cost savings.
 */
interface NamedCallsTableProps {
  data: LabNamedCall[];
  itemsPerPage?: number;
}

const NamedCallsTable: React.FC<NamedCallsTableProps> = ({
  data,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(3)}`;

  const getStatusBadge = (status: LabNamedCall['status']) => {
    switch (status) {
      case 'optimized':
        return (
          <div className="flex items-center gap-1 justify-start text-primary rounded-full p-1">
            <CheckCircle className="h-3 w-3" />
            <span>Optimized</span>
          </div>
        );
      case 'action-available':
        return (
          <div className="flex items-center gap-1 justify-start text-yellow-400 rounded-full p-1">
            <Target className="h-3 w-3" />
            <span>Action Available</span>
          </div>
        );
      case 'analyzing':
        return (
          <div className="flex items-center gap-1 justify-start text-muted-foreground  rounded-full p-1">
            <Clock className="h-3 w-3" />
            <span>Analyzing</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 justify-start text-muted-foreground rounded-full p-1">
            <HelpCircle className="h-3 w-3" />
            <span>Unknown</span>
          </div>
        );
    }
  };

  const formatLastBenchmarked = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Named Call</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[120px]">Current Model</TableHead>
              <TableHead className="w-[120px]">Last Benchmarked</TableHead>
              <TableHead className="w-[100px] text-right">Cost/Call</TableHead>
              <TableHead className="w-[100px] text-right">Call Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((call) => (
              <TableRow
                key={call.id}
                className="hover:bg-muted/50 cursor-pointer"
              >
                <Link href={`/lab/${call.id}`} className="contents">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{call.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        v{call.promptVersion}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{call.currentModel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastBenchmarked(call.lastBenchmarked)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(call.currentCostPerCall)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {call.callCount.toLocaleString()}
                  </TableCell>
                </Link>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of{' '}
          {data.length} named calls
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NamedCallsTable;
