
import subprocess

def run_vm_creation_powershell(vm_data):
    script = f"""
$vmName = "{vm_data['vmName']}"
$esxiHost = "{vm_data['esxiHost']}"
$datastore = "{vm_data['datastore']}"
$network = "{vm_data['network']}"
$cpuCount = {vm_data['cpuCount']}
$memoryGB = {vm_data['memoryGB']}
$diskGB = {vm_data['diskGB']}
$isoPath = "{vm_data['isoPath']}"
$guestOS = "{vm_data['guestOS']}"

Import-Module VMware.PowerCLI
Import-Module VMware.VimAutomation.Core
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false
$cred = Get-Credential
Connect-VIServer -Server "{vm_data['vcenter']}" -Credential $cred

$newVM = New-VM -Name $vmName -VMHost $esxiHost -Datastore $datastore -NetworkName $network `
    -NumCPU $cpuCount -MemoryGB $memoryGB -DiskGB $diskGB -GuestId $guestOS

Get-VM -Name $vmName | New-CDDrive -Confirm:$false
Get-VM -Name $vmName | Get-CDDrive | Set-CDDrive -IsoPath $isoPath -Confirm:$false

$vm = Get-VM -Name $vmName
$spec = New-Object VMware.Vim.VirtualMachineConfigSpec
$spec.bootOptions = New-Object VMware.Vim.VirtualMachineBootOptions
$spec.bootOptions.bootDelay = 5000
$vm.ExtensionData.ReconfigVM_Task($spec)

if ($vm.PowerState -ne "PoweredOn") {{
    Start-VM -VM $vm
    Start-Sleep -Seconds 5
    Get-VM -Name $vmName | Get-CDDrive | Set-CDDrive -Connected $true -StartConnected $true -Confirm:$false
}}

Write-Host "✅ VM '$vmName' created and powered on."
"""
    subprocess.run(["powershell", "-Command", script], capture_output=True)
