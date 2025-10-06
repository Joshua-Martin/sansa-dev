'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../common/button';
import { Input } from '../../common/input';
import { Label } from '../../common/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '../../common/dialog';
import { Badge } from '../../common/badge';
import { CopyButton } from '../../common/copy-button';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../../lib/auth/auth.api';
import { useToast } from '../../common/use-toast';
import type { ApiKeyListItem, ApiKeyResponse, CreateApiKeyRequest } from '@sansa-dev/s-shared';

/**
 * API Keys Manager Component
 *
 * Allows users to create, view, and manage their API keys for Sansa-X integration.
 */
const ApiKeysManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatedKeyDialogOpen, setIsCreatedKeyDialogOpen] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKeyListItem | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<ApiKeyResponse | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const { toast } = useToast();

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await authApi.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys', error);
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
      const createRequest: CreateApiKeyRequest = {
        name: newApiKeyName.trim(),
      };
      const createdKey = await authApi.createApiKey(createRequest);

      setCreatedApiKey(createdKey);
      setNewApiKeyName('');
      setIsCreateDialogOpen(false);
      setIsCreatedKeyDialogOpen(true); // Open the created key dialog
      await loadApiKeys(); // Refresh the list

      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error && typeof error === 'object' && 'message' in error ? error.message : 'Failed to create API key'),
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
    } catch (error) {
      toast({
        title: 'Error',
        description: (error && typeof error === 'object' && 'message' in error ? error.message : 'Failed to deactivate API key'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = (apiKey: ApiKeyListItem) => {
    setApiKeyToDelete(apiKey);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteApiKey = async () => {
    if (!apiKeyToDelete) return;

    try {
      setIsLoading(true);
      await authApi.deleteApiKey(apiKeyToDelete.id);
      await loadApiKeys(); // Refresh the list

      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error && typeof error === 'object' && 'message' in error ? error.message : 'Failed to delete API key'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setApiKeyToDelete(null);
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
    <div className="space-y-6">
      {/* Created API Key Dialog */}
      <Dialog open={isCreatedKeyDialogOpen} onOpenChange={setIsCreatedKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              API Key Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your new API key has been created. Copy it now as it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Name:</strong> {createdApiKey?.name}
              </p>
              <div className="flex items-center gap-2">
                <strong className="text-sm">Key:</strong>
                <code className="bg-muted px-3 py-1 rounded text-sm font-mono border flex-1 min-w-0">
                  {showCreatedKey ? createdApiKey?.key : '•'.repeat(32)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatedKey(!showCreatedKey)}
                >
                  {showCreatedKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <CopyButton textToCopy={createdApiKey?.key || ''} />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 dark:bg-yellow-950 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 font-medium dark:text-yellow-200">
                  ⚠️ Copy this key now - it will not be shown again!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setCreatedApiKey(null);
                  setIsCreatedKeyDialogOpen(false);
                  setShowCreatedKey(false);
                }}
              >
                I&apos;ve copied the key
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-medium">Your API Keys</h4>
          <p className="text-sm text-muted-foreground">
            Create and manage API keys for accessing Sansa-X services
          </p>
        </div>
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
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the API key &quot;{apiKeyToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteApiKey}
              disabled={isLoading}
            >
              Delete API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground mb-2">No API keys found</p>
            <p className="text-sm text-muted-foreground">
              Create your first API key to get started with Sansa-X integration.
            </p>
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-base">{apiKey.name}</span>
                    <div className="flex gap-2">
                      <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired(apiKey.expiresAt) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Requests:</span> {apiKey.requestCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Last used:</span> {formatDate(apiKey.lastUsedAt)}
                    </div>
                    {apiKey.expiresAt && (
                      <div>
                        <span className="font-medium">Expires:</span> {formatDate(apiKey.expiresAt)}
                        {isExpired(apiKey.expiresAt) && <span className="text-destructive"> (Expired)</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
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
                    onClick={() => handleDeleteApiKey(apiKey)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApiKeysManager;
