
import React from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { VM } from '../types/vm';
import { Server, Cpu, HardDrive, MemoryStick, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VMTableProps {
  vms: VM[];
  isLoading?: boolean;
}

const VMTable: React.FC<VMTableProps> = ({ vms, isLoading = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResultBadge = (result?: string) => {
    if (!result) {
      return (
        <Badge variant="secondary" className="w-fit">
          <AlertCircle className="h-3 w-3 mr-1" />
          No Result
        </Badge>
      );
    }

    if (result.startsWith('SUCCESS:')) {
      return (
        <Badge variant="default" className="w-fit bg-green-100 text-green-800 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else if (result.startsWith('ERROR:')) {
      return (
        <Badge variant="destructive" className="w-fit">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="w-fit">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unknown
        </Badge>
      );
    }
  };

  const getResultDetails = (result?: string) => {
    if (!result) return 'No execution result available';
    
    // Remove the SUCCESS: or ERROR: prefix and show the actual message
    if (result.startsWith('SUCCESS:')) {
      return result.substring(8).trim();
    } else if (result.startsWith('ERROR:')) {
      return result.substring(6).trim();
    }
    
    return result;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Virtual Machines ({vms.length})
        </CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {vms.map((vm) => (
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
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getResultBadge(vm.result)}
                      {vm.result && (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={getResultDetails(vm.result)}>
                          {getResultDetails(vm.result)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(vm.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VMTable;
