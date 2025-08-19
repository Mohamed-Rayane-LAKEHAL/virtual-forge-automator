param(
    [string]$vmName,
    [string]$vcenter
)

# -----------------------------------------------
# ✅ Install PowerCLI if not already installed
# -----------------------------------------------
if (-not (Get-Module -ListAvailable -Name VMware.PowerCLI)) {
    Install-Module -Name VMware.PowerCLI -Scope CurrentUser -Force -AllowClobber
}

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
$user = "administrator@vsphere.local"
$pass = "Time4work!" | ConvertTo-SecureString -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($user, $pass)

# Always work in Single mode
Set-PowerCLIConfiguration -DefaultVIServerMode Single -Confirm:$false

try {
    # Connect to vCenter
    Connect-VIServer -Server $vcenter -Credential $cred
    
    # Get the VM
    $vm = Get-VM -Name $vmName -ErrorAction SilentlyContinue
    
    if ($null -eq $vm) {
        Write-Host "❌ VM '$vmName' not found on vCenter '$vcenter'"
        exit 1
    }
    
    # Check if VM is powered on and power it off if needed
    if ($vm.PowerState -eq "PoweredOn") {
        Write-Host "🔄 Powering off VM '$vmName'..."
        Stop-VM -VM $vm -Confirm:$false
        
        # Wait for VM to power off
        do {
            Start-Sleep -Seconds 2
            $vm = Get-VM -Name $vmName
        } while ($vm.PowerState -ne "PoweredOff")
        
        Write-Host "✅ VM '$vmName' powered off successfully"
    }
    
    # Delete the VM
    Write-Host "🗑️ Deleting VM '$vmName'..."
    Remove-VM -VM $vm -DeletePermanently -Confirm:$false
    
    Write-Host "✅ VM '$vmName' has been successfully deleted from vCenter '$vcenter'"
    
} catch {
    Write-Host "❌ Error deleting VM '$vmName': $($_.Exception.Message)"
    exit 1
} finally {
    # Disconnect from vCenter
    if ($global:DefaultVIServer) {
        Disconnect-VIServer -Server $global:DefaultVIServer -Confirm:$false
    }
}