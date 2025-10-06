'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../common/button';
import { Input } from '../../common/input';
import { Label } from '../../common/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../common/dialog';
import { Alert, AlertDescription } from '../../common/alert';
import { Badge } from '../../common/badge';
import { CopyButton } from '../../common/copy-button';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../../lib/auth/auth.api';
import type { ApiKeyListResponse, ApiKeyResponse } from '../../../lib/auth/auth.api';
import { useToast } from '../../common/use-toast';

/**
 * API Keys Manager Component
 *
 * Allows users to create, view, and manage their API keys for Sansa-X integration.
 */
const ApiKeysManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<ApiKeyResponse | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const { toast } = useToast();

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await authApi.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'API key name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const createdKey = await authApi.createApiKey({
        name: newApiKeyName.trim(),
      });

      setCreatedApiKey(createdKey);
      setNewApiKeyName('');
      setIsCreateDialogOpen(false);
      await loadApiKeys(); // Refresh the list

      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateApiKey = async (apiKeyId: string) => {
    try {
      setIsLoading(true);
      await authApi.deactivateApiKey(apiKeyId);
      await loadApiKeys(); // Refresh the list

      toast({
        title: 'Success',
        description: 'API key deactivated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to deactivate API key',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await authApi.deleteApiKey(apiKeyId);
      await loadApiKeys(); // Refresh the list

      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Created API Key Alert */}
      {createdApiKey && (
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">API Key Created Successfully!</p>
              <p className="text-sm">
                <strong>Name:</strong> {createdApiKey.name}
              </p>
              <div className="flex items-center gap-2">
                <strong>Key:</strong>
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {showCreatedKey ? createdApiKey.key : '•'.repeat(32)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatedKey(!showCreatedKey)}
                >
                  {showCreatedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <CopyButton text={createdApiKey.key} />
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Copy this key now - it will not be shown again!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedApiKey(null)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key-name">API Key Name</Label>
              <Input
                id="api-key-name"
                placeholder="e.g., Production App, Development, etc."
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateApiKey();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateApiKey} disabled={isLoading}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Keys List */}
      <div className="space-y-2">
        {apiKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No API keys found. Create your first API key to get started with Sansa-X integration.
          </p>
        ) : (
          apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{apiKey.name}</span>
                  <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                    {apiKey.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {isExpired(apiKey.expiresAt) && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Requests: {apiKey.requestCount.toLocaleString()}</p>
                  <p>Last used: {formatDate(apiKey.lastUsedAt)}</p>
                  {apiKey.expiresAt && (
                    <p>
                      Expires: {formatDate(apiKey.expiresAt)}
                      {isExpired(apiKey.expiresAt) && ' (Expired)'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {apiKey.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeactivateApiKey(apiKey.id)}
                    disabled={isLoading}
                  >
                    Deactivate
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiKeysManager;
