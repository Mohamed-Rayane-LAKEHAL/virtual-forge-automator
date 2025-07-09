
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { VMFormData } from '../types/vm';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface AddVMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVMCreated: () => void;
}

const AddVMModal: React.FC<AddVMModalProps> = ({ open, onOpenChange, onVMCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<VMFormData>({
    defaultValues: {
      vmName: '',
      esxiHost: '',
      datastore: '',
      network: '',
      cpuCount: 1,
      memoryGB: 1,
      diskGB: 20,
      isoPath: '',
      guestOS: '',
      vcenter: '',
    },
  });

  const onSubmit = async (data: VMFormData) => {
    setIsLoading(true);
    try {
      await apiService.createVM(data);
      toast({
        title: "VM Creation Started",
        description: `VM "${data.vmName}" is being created. This may take several minutes.`,
      });
      form.reset();
      onOpenChange(false);
      onVMCreated();
    } catch (error) {
      toast({
        title: "Failed to create VM",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Virtual Machine</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new VM on your vCenter server.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VM Name</FormLabel>
                    <FormControl>
                      <Input placeholder="my-vm-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="esxiHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ESXi Host</FormLabel>
                    <FormControl>
                      <Input placeholder="esxi-host-01.domain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="datastore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datastore</FormLabel>
                    <FormControl>
                      <Input placeholder="datastore1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="network"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <FormControl>
                      <Input placeholder="VM Network" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpuCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPU Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="32" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memoryGB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory (GB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="128" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diskGB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disk Size (GB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestOS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest OS</FormLabel>
                    <FormControl>
                      <Input placeholder="windows9Server64Guest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isoPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ISO Path</FormLabel>
                  <FormControl>
                    <Input placeholder="[datastore1] iso/windows-server-2019.iso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vcenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>vCenter Server</FormLabel>
                  <FormControl>
                    <Input placeholder="vcenter.domain.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating VM..." : "Create VM"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVMModal;
