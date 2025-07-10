
import subprocess
import os

def run_vm_creation_powershell(vm_data):
    # Get the absolute path to the PowerShell script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ps_script = os.path.join(script_dir, "deploy-ubuntu-vm.ps1")
    
    # PowerShell configuration commands
    setup_cmds = r"""
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false | Out-Null
Set-PowerCLIConfiguration -DefaultVIServerMode Single -Confirm:$false | Out-Null
"""
    
    # Build the command with parameters
    command = f"""
{setup_cmds}
& '{ps_script}' -vmName '{vm_data['vmName']}' -esxiHost '{vm_data['esxiHost']}' -datastore '{vm_data['datastore']}' -network '{vm_data['network']}' -cpuCount {vm_data['cpuCount']} -memoryGB {vm_data['memoryGB']} -diskGB {vm_data['diskGB']} -isoPath '{vm_data['isoPath']}' -guestOS '{vm_data['guestOS']}' -vcenter '{vm_data['vcenter']}'
"""
    
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Script output:")
        print(result.stdout)
        return {"success": True, "output": result.stdout}
    except subprocess.CalledProcessError as e:
        print("❌ Error running script:")
        print(e.stderr)
        return {"success": False, "error": e.stderr}
