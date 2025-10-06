'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';
import PageTitle from '../../../components/custom/ui/page-title';
import { Button } from '../../../components/common/button';
import { Badge } from '../../../components/common/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/common/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/common/tabs';
import {
  Calendar,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { authApi } from '../../../lib/auth/auth.api';
import type {
  LLMApiCallRecord,
  MonitoringStats,
} from '../../../lib/auth/auth.api';
import { useToast } from '../../../components/common/use-toast';

/**
 * Monitoring Dashboard Page
 *
 * Displays LLM API call monitoring data with statistics and detailed records.
 */
const MonitoringPage: React.FC = () => {
  const [records, setRecords] = useState<LLMApiCallRecord[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LLMApiCallRecord | null>(
    null
  );
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true);
      const [recordsData, statsData] = await Promise.all([
        authApi.getMonitoringRecords({ limit: 100 }),
        authApi.getMonitoringStats(),
      ]);

      setRecords(recordsData);
      setStats(statsData);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (record: LLMApiCallRecord) => {
    if (record.error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (record: LLMApiCallRecord) => {
    if (record.error) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="default">Success</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PageTitle
            title="LLM Monitoring Dashboard"
            subtitle="Monitor your LLM API usage and performance"
          />

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Calls
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.totalCalls || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.totalCalls || 0) > 0
                      ? `${(((stats.successfulCalls || 0) / (stats.totalCalls || 1)) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Response Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(stats.avgDurationMs || null)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tokens
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.totalTokens || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="records" className="space-y-6">
            <TabsList>
              <TabsTrigger value="records">API Call Records</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent API Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  {records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No API calls recorded yet.</p>
                      <p className="text-sm">
                        Start using Sansa-X to see your monitoring data here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(record)}
                                  {getStatusBadge(record)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {record.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    v{record.promptVersion}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{record.model}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {record.provider}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDuration(record.durationMs)}
                              </TableCell>
                              <TableCell>
                                {(
                                  record.inputTokenCount +
                                  record.outputTokenCount
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {formatDate(record.requestTimestamp)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced analytics coming soon.</p>
                    <p className="text-sm">
                      Charts and graphs for deeper insights into your LLM usage.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Record Details Modal */}
          {selectedRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">API Call Details</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRecord(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Call ID
                        </label>
                        <p className="font-mono text-sm">{selectedRecord.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Name
                        </label>
                        <p>{selectedRecord.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Prompt Version
                        </label>
                        <p>{selectedRecord.promptVersion}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Model
                        </label>
                        <p>{selectedRecord.model}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Provider
                        </label>
                        <p>{selectedRecord.provider}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Status
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(selectedRecord)}
                          {getStatusBadge(selectedRecord)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Duration
                        </label>
                        <p>{formatDuration(selectedRecord.durationMs)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Tokens
                        </label>
                        <p>
                          Input:{' '}
                          {selectedRecord.inputTokenCount?.toLocaleString() ||
                            0}
                          , Output:{' '}
                          {selectedRecord.outputTokenCount?.toLocaleString() ||
                            0}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Request Time
                        </label>
                        <p>{formatDate(selectedRecord.requestTimestamp)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Response Time
                        </label>
                        <p>{formatDate(selectedRecord.responseTimestamp)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedRecord.error && (
                    <div className="mt-6">
                      <label className="text-sm font-medium text-muted-foreground">
                        Error
                      </label>
                      <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                          {JSON.stringify(selectedRecord.error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedRecord.response && (
                    <div className="mt-6">
                      <label className="text-sm font-medium text-muted-foreground">
                        Response
                      </label>
                      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-60 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                          {selectedRecord.response}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;
