
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VM } from '../types/vm';

interface VMDetailsModalProps {
  vm: VM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VMDetailsModal: React.FC<VMDetailsModalProps> = ({ vm, open, onOpenChange }) => {
  if (!vm) return null;

  const formatResult = (result?: string) => {
    if (!result) return 'No execution result available';
    
    // Remove the SUCCESS: or ERROR: prefix for display
    if (result.startsWith('SUCCESS:')) {
      return result.substring(8).trim();
    } else if (result.startsWith('ERROR:')) {
      return result.substring(6).trim();
    }
    
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>VM Creation Details - {vm.vmName}</DialogTitle>
          <DialogDescription>
            PowerShell execution result for virtual machine creation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                vm.status === 'success' ? 'bg-green-100 text-green-800' :
                vm.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {vm.status.toUpperCase()}
              </span>
            </div>
            <div><strong>Created:</strong> {new Date(vm.created_at).toLocaleString()}</div>
            <div><strong>ESXi Host:</strong> {vm.esxiHost}</div>
            <div><strong>vCenter:</strong> {vm.vcenter}</div>
            <div><strong>CPU:</strong> {vm.cpuCount} cores</div>
            <div><strong>Memory:</strong> {vm.memoryGB} GB</div>
            <div><strong>Disk:</strong> {vm.diskGB} GB</div>
            <div><strong>Guest OS:</strong> {vm.guestOS}</div>
          </div>

          <div>
            <strong className="text-sm">Execution Output:</strong>
            <ScrollArea className="mt-2 h-64 w-full rounded border p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {formatResult(vm.result)}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VMDetailsModal;
