
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Upload, Download } from 'lucide-react';
import { VMFormData } from '../types/vm';
import { apiService } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface BatchVMData extends Omit<VMFormData, 'vmName'> {
  vmNames: string[];
}

interface BatchAddVMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVMsCreated: () => void;
}

const BatchAddVMModal: React.FC<BatchAddVMModalProps> = ({ 
  open, 
  onOpenChange, 
  onVMsCreated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vmNames, setVmNames] = useState<string[]>(['']);
  const [batchData, setBatchData] = useState<Omit<VMFormData, 'vmName'>>({
    esxiHost: '',
    datastore: '',
    network: 'VM Network',
    cpuCount: 2,
    memoryGB: 4,
    diskGB: 40,
    isoPath: '',
    guestOS: 'windows9Server64Guest',
    vcenter: '',
  });
  const { toast } = useToast();

  const addVmName = () => {
    setVmNames([...vmNames, '']);
  };

  const removeVmName = (index: number) => {
    if (vmNames.length > 1) {
      setVmNames(vmNames.filter((_, i) => i !== index));
    }
  };

  const updateVmName = (index: number, value: string) => {
    const updated = [...vmNames];
    updated[index] = value;
    setVmNames(updated);
  };

  const handleBulkNamesInput = (text: string) => {
    const names = text.split('\n').filter(name => name.trim() !== '');
    setVmNames(names.length > 0 ? names : ['']);
  };

  const exportTemplate = () => {
    const csvContent = [
      'vmName,esxiHost,datastore,network,cpuCount,memoryGB,diskGB,isoPath,guestOS,vcenter',
      vmNames.filter(name => name.trim()).map(name => 
        `${name},${batchData.esxiHost},${batchData.datastore},${batchData.network},${batchData.cpuCount},${batchData.memoryGB},${batchData.diskGB},${batchData.isoPath},${batchData.guestOS},${batchData.vcenter}`
      ).join('\n')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vm-batch-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSubmit = async () => {
    const validNames = vmNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) {
      toast({
        title: "No VM names provided",
        description: "Please add at least one VM name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const batchRequest = {
        ...batchData,
        vmNames: validNames
      };

      await apiService.createBatchVMs(batchRequest);
      
      toast({
        title: "Batch VM Creation Started",
        description: `${validNames.length} VMs are being created. This may take several minutes.`,
      });
      
      setVmNames(['']);
      setBatchData({
        esxiHost: '',
        datastore: '',
        network: 'VM Network',
        cpuCount: 2,
        memoryGB: 4,
        diskGB: 40,
        isoPath: '',
        guestOS: 'windows9Server64Guest',
        vcenter: '',
      });
      onOpenChange(false);
      onVMsCreated();
    } catch (error) {
      toast({
        title: "Failed to create VMs",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Add Virtual Machines</DialogTitle>
          <DialogDescription>
            Create multiple VMs at once using a shared template configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* VM Names Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">VM Names</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {vmNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`VM-${index + 1}`}
                      value={name}
                      onChange={(e) => updateVmName(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVmName(index)}
                      disabled={vmNames.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addVmName}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add VM Name
                </Button>
                <Button type="button" variant="outline" onClick={exportTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Or paste multiple names (one per line):</Label>
                <Textarea
                  placeholder="VM-Web-01&#10;VM-Web-02&#10;VM-DB-01"
                  onChange={(e) => handleBulkNamesInput(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ESXi Host *</Label>
                  <Input
                    placeholder="esxi-host-01.domain.com"
                    value={batchData.esxiHost}
                    onChange={(e) => setBatchData({...batchData, esxiHost: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Datastore *</Label>
                  <Input
                    placeholder="datastore1"
                    value={batchData.datastore}
                    onChange={(e) => setBatchData({...batchData, datastore: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Network</Label>
                  <Input
                    placeholder="VM Network"
                    value={batchData.network}
                    onChange={(e) => setBatchData({...batchData, network: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>vCenter Server *</Label>
                  <Input
                    placeholder="vcenter.domain.com"
                    value={batchData.vcenter}
                    onChange={(e) => setBatchData({...batchData, vcenter: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>CPU Count</Label>
                  <Input
                    type="number"
                    min="1"
                    max="32"
                    value={batchData.cpuCount}
                    onChange={(e) => setBatchData({...batchData, cpuCount: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Memory (GB)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="128"
                    value={batchData.memoryGB}
                    onChange={(e) => setBatchData({...batchData, memoryGB: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disk Size (GB)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="2000"
                    value={batchData.diskGB}
                    onChange={(e) => setBatchData({...batchData, diskGB: parseInt(e.target.value) || 20})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Guest OS *</Label>
                  <Input
                    placeholder="windows9Server64Guest"
                    value={batchData.guestOS}
                    onChange={(e) => setBatchData({...batchData, guestOS: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>ISO Path *</Label>
                <Input
                  placeholder="[datastore1] iso/windows-server-2019.iso"
                  value={batchData.isoPath}
                  onChange={(e) => setBatchData({...batchData, isoPath: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {vmNames.filter(name => name.trim()).length} VM(s) will be created with the template configuration above.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating VMs..." : `Create ${vmNames.filter(name => name.trim()).length} VM(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAddVMModal;
