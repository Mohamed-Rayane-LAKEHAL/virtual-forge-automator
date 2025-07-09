
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
import { VM } from '../types/vm';
import { Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface VMTableProps {
  vms: VM[];
}

const VMTable: React.FC<VMTableProps> = ({ vms }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
