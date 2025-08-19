
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { VM } from '../types/vm';
import { Server, Cpu, HardDrive, MemoryStick, CheckCircle, XCircle, Clock, Eye, Copy, Trash2 } from 'lucide-react';
import VMDetailsModal from './VMDetailsModal';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface VMTableProps {
  vms: VM[];
  isLoading?: boolean;
  onVMCreated?: () => void;
}

const VMTable: React.FC<VMTableProps> = ({ vms, isLoading = false, onVMCreated }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [copyingVmId, setCopyingVmId] = useState<number | null>(null);
  const [deletingVmId, setDeletingVmId] = useState<number | null>(null);
  const [vmToDelete, setVmToDelete] = useState<VM | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, deleted?: boolean) => {
    // Special handling for deleted VMs
    if (deleted === true) {
      return (
        <Badge variant="default" className="w-fit bg-red-600 text-white hover:bg-red-700 font-semibold">
          <XCircle className="h-3 w-3 mr-1" />
          VM Deleted
        </Badge>
      );
    }
    
    if (status === 'pending' && deleted === false) {
      return (
        <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-200 animate-pulse">
          <Clock className="h-3 w-3 mr-1" />
          Deleting VM...
        </Badge>
      );
    }

    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="w-fit bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="w-fit">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="w-fit bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="w-fit">
            Unknown
          </Badge>
        );
    }
  };

  const handleViewDetails = (vm: VM) => {
    setSelectedVM(vm);
    setIsDetailsModalOpen(true);
  };

  const handleCopyVM = async (vm: VM) => {
    setCopyingVmId(vm.id);
    try {
      const copyData = {
        vmName: `${vm.vmName}-copy`,
        esxiHost: vm.esxiHost,
        datastore: vm.datastore,
        network: vm.network,
        cpuCount: vm.cpuCount,
        memoryGB: vm.memoryGB,
        diskGB: vm.diskGB,
        isoPath: vm.isoPath,
        guestOS: vm.guestOS,
        vcenter: vm.vcenter,
      };

      await apiService.createVM(copyData);
      toast({
        title: "VM Copied Successfully",
        description: `${copyData.vmName} has been created`,
      });
      onVMCreated?.();
    } catch (error) {
      toast({
        title: "Error Copying VM",
        description: error instanceof Error ? error.message : "Failed to copy VM",
        variant: "destructive",
      });
    } finally {
      setCopyingVmId(null);
    }
  };

  const handleDeleteVM = async (vm: VM) => {
    setDeletingVmId(vm.id);
    setIsDeleteDialogOpen(false);
    try {
      await apiService.deleteVM(vm.id);
      toast({
        title: "VM Deletion Started",
        description: `${vm.vmName} deletion process has been initiated`,
      });
      onVMCreated?.(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error Deleting VM",
        description: error instanceof Error ? error.message : "Failed to delete VM",
        variant: "destructive",
      });
    } finally {
      setDeletingVmId(null);
    }
  };

  const handleDeleteClick = (vm: VM) => {
    setVmToDelete(vm);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (vmToDelete) {
      handleDeleteVM(vmToDelete);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(vms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVMs = vms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Loading Virtual Machines...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Server className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No virtual machines found</p>
          <p className="text-sm text-muted-foreground">Create your first VM to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Virtual Machines ({vms.length})
            </CardTitle>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VM Name</TableHead>
                  <TableHead>ESXi Host</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Guest OS</TableHead>
                  <TableHead>vCenter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentVMs.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell className="font-medium">{vm.vmName}</TableCell>
                    <TableCell>{vm.esxiHost}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          <Cpu className="h-3 w-3 mr-1" />
                          {vm.cpuCount} CPU
                        </Badge>
                        <Badge variant="outline" className="w-fit">
                          <MemoryStick className="h-3 w-3 mr-1" />
                          {vm.memoryGB} GB RAM
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          <HardDrive className="h-3 w-3 mr-1" />
                          {vm.diskGB} GB
                        </Badge>
                        <span className="text-xs text-muted-foreground">{vm.datastore}</span>
                      </div>
                    </TableCell>
                    <TableCell>{vm.network}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{vm.guestOS}</Badge>
                    </TableCell>
                    <TableCell>{vm.vcenter}</TableCell>
                    <TableCell>{getStatusBadge(vm.status, vm.deleted)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(vm.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {vm.status !== 'pending' && !vm.deleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(vm)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {!vm.deleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyVM(vm)}
                            disabled={copyingVmId === vm.id}
                            className="h-8 w-8 p-0"
                            title="Copy VM"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        {!vm.deleted && vm.status !== 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(vm)}
                            disabled={deletingVmId === vm.id}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                            title="Remove VM"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <VMDetailsModal
        vm={selectedVM}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Virtual Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{vmToDelete?.vmName}"? This action will permanently delete the VM from the vCenter server and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove VM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VMTable;
