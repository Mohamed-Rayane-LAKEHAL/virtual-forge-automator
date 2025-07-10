
import subprocess

def run_vm_creation_powershell(vm_data):
    script = f"""
# -----------------------------------------------
# ✅ Install PowerCLI if not already installed
# -----------------------------------------------
# Install-Module -Name VMware.PowerCLI -Scope CurrentUser -Force -AllowClobber
if (-not (Get-Module -ListAvailable -Name VMware.PowerCLI)) {{
    Install-Module -Name VMware.PowerCLI -Scope CurrentUser -Force -AllowClobber
}}

# -----------------------------------------------
# ✅ Import required modules
# -----------------------------------------------
Import-Module VMware.PowerCLI
Import-Module VMware.VimAutomation.Core

# Ignore self-signed certs (macOS/vCenter lab envs)
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false

# -----------------------------------------------
# ✅ Connect to vCenter using credentials
# -----------------------------------------------
#$cred = Get-Credential
$user = "administrator@vsphere.local"
$pass = "Time4work!" | ConvertTo-SecureString -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($user, $pass)

# Always work in Single mode (recommended if you only ever target one vCenter at a time)
Set-PowerCLIConfiguration -DefaultVIServerMode Single -Confirm:$false
#Set-PowerCLIConfiguration -DefaultVIServerMode Multiple -Confirm:$false

Connect-VIServer -Server "{vm_data['vcenter']}" -Credential $cred

# -----------------------------------------------
# ✅ Define VM Configuration
# -----------------------------------------------
$vmName     = "{vm_data['vmName']}"
$esxiHost   = "{vm_data['esxiHost']}"
$datastore  = "{vm_data['datastore']}"
$network    = "{vm_data['network']}"
$cpuCount   = {vm_data['cpuCount']}
$memoryGB   = {vm_data['memoryGB']}
$diskGB     = {vm_data['diskGB']}
$isoPath    = "{vm_data['isoPath']}"
$guestOS    = "{vm_data['guestOS']}"

# -----------------------------------------------
# ✅ Create the VM
# -----------------------------------------------
$newVM = New-VM -Name $vmName `
    -VMHost $esxiHost `
    -Datastore $datastore `
    -NetworkName $network `
    -NumCPU $cpuCount `
    -MemoryGB $memoryGB `
    -DiskGB $diskGB `
    -GuestId $guestOS

# -----------------------------------------------
# ✅ Add a blank CD/DVD drive
# -----------------------------------------------
Get-VM -Name $vmName | New-CDDrive -Confirm:$false

# -----------------------------------------------
# ✅ Mount the ISO (while VM is powered off)
# -----------------------------------------------
Get-VM -Name $vmName | Get-CDDrive | Set-CDDrive -IsoPath $isoPath -Confirm:$false

# -----------------------------------------------
# ✅ Add boot delay for BIOS access
# -----------------------------------------------
$vm = Get-VM -Name $vmName
$spec = New-Object VMware.Vim.VirtualMachineConfigSpec
$spec.bootOptions = New-Object VMware.Vim.VirtualMachineBootOptions
$spec.bootOptions.bootDelay = 5000
$vm.ExtensionData.ReconfigVM_Task($spec)

# -----------------------------------------------
# ✅ Power on the VM and connect CD/DVD
# -----------------------------------------------
if ($vm.PowerState -ne "PoweredOn") {{
    Start-VM -VM $vm
    Start-Sleep -Seconds 5
    Get-VM -Name $vmName | Get-CDDrive | Set-CDDrive -Connected $true -StartConnected $true -Confirm:$false
    Write-Host "✅ VM powered on and ISO connected."
}} else {{
    Write-Host "⚠️ VM already powered on. Skipping start."
}}

# -----------------------------------------------
# ✅ Script Complete
# -----------------------------------------------
Write-Host "✅ VM '$vmName' created, CD/DVD drive added, ISO mounted, and VM powered on."
"""
    subprocess.run(["powershell", "-Command", script], capture_output=True)
