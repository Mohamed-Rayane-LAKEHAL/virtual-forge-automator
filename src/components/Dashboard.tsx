
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import VMTable from './VMTable';
import AddVMModal from './AddVMModal';
import { VM } from '../types/vm';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const [vms, setVms] = useState<VM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchVMs = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getVMs();
      setVms(data);
    } catch (error) {
      toast({
        title: "Failed to load VMs",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVMs();
  }, []);

  const handleVMCreated = () => {
    fetchVMs();
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
                onClick={fetchVMs}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
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

              <VMTable vms={vms} />
            </div>
          </main>
        </div>
      </div>

      <AddVMModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onVMCreated={handleVMCreated}
      />
    </SidebarProvider>
  );
};

export default Dashboard;
