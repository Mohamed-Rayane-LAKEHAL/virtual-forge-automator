import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import VMTable from './VMTable';
import AddVMModal from './AddVMModal';
import VMDetailsModal from './VMDetailsModal';
import { VM } from '../types/vm';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import BatchAddVMModal from './BatchAddVMModal';

const Dashboard: React.FC = () => {
  const [vms, setVms] = useState<VM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Handle VM details modal state from URL parameters
  useEffect(() => {
    const vmId = searchParams.get('vmDetails');
    if (vmId && vms.length > 0) {
      const vm = vms.find(v => v.id === parseInt(vmId));
      if (vm) {
        setSelectedVM(vm);
      }
    } else {
      setSelectedVM(null);
    }
  }, [searchParams, vms]);

  const fetchVMs = async (showToast = false) => {
    try {
      setError(null);
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);
      
      const data = await apiService.getVMs();
      setVms(data);
      
      if (showToast) {
        toast({
          title: "VMs refreshed",
          description: `Loaded ${data.length} virtual machines`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load VMs";
      setError(errorMessage);
      toast({
        title: "Failed to load VMs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVMs();
    
    // Set up auto-refresh every 30 seconds to check for status updates
    const interval = setInterval(() => {
      fetchVMs();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleVMCreated = () => {
    fetchVMs(true);
  };

  const handleRefresh = () => {
    fetchVMs(true);
  };

  const handleVMDetailsClose = () => {
    setSelectedVM(null);
    setSearchParams({});
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBatchModalOpen(true)} 
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Batch Add VMs
              </Button>
              <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Add New VM
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">VM Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage and monitor your virtual machines
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    {error}. Make sure your Flask backend is running on localhost:5000.
                  </AlertDescription>
                </Alert>
              )}

              <VMTable 
                vms={vms} 
                isLoading={isLoading} 
              />
            </div>
          </main>
        </div>
      </div>

      <AddVMModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onVMCreated={handleVMCreated}
      />

      <BatchAddVMModal
        open={isBatchModalOpen}
        onOpenChange={setIsBatchModalOpen}
        onVMsCreated={handleVMCreated}
      />

      <VMDetailsModal
        vm={selectedVM}
        open={!!selectedVM}
        onOpenChange={handleVMDetailsClose}
      />
    </SidebarProvider>
  );
};

export default Dashboard;
