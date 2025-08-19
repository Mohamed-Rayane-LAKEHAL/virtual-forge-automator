import subprocess
import os
import platform

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

    print("COMMAND: ", command)
    print("SYSTEM : ", platform.system())
    # Determine the PowerShell executable based on the operating system
    if platform.system() == "Windows":
        ps_executable = "powershell.exe"
    else:
        # For Linux/macOS, use PowerShell Core
        ps_executable = "pwsh"
    
    try:
        result = subprocess.run(
            [ps_executable, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
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
    except FileNotFoundError as e:
        error_msg = f"PowerShell not found. Please install PowerShell Core (pwsh) on Linux/macOS or ensure powershell.exe is available on Windows. Error: {str(e)}"
        print("❌ PowerShell executable not found:")
        print(error_msg)
        return {"success": False, "error": error_msg}

def run_vm_deletion_powershell(vm_data):
    # Get the absolute path to the PowerShell script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ps_script = os.path.join(script_dir, "delete-vm.ps1")
    
    # PowerShell configuration commands
    setup_cmds = r"""
Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false | Out-Null
Set-PowerCLIConfiguration -DefaultVIServerMode Single -Confirm:$false | Out-Null
"""
    
    # Build the command with parameters
    command = f"""
{setup_cmds}
& '{ps_script}' -vmName '{vm_data['vmName']}' -vcenter '{vm_data['vcenter']}'
"""

    print("DELETE COMMAND: ", command)
    print("SYSTEM : ", platform.system())
    # Determine the PowerShell executable based on the operating system
    if platform.system() == "Windows":
        ps_executable = "powershell.exe"
    else:
        # For Linux/macOS, use PowerShell Core
        ps_executable = "pwsh"
    
    try:
        result = subprocess.run(
            [ps_executable, "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Delete script output:")
        print(result.stdout)
        return {"success": True, "output": result.stdout}
    except subprocess.CalledProcessError as e:
        print("❌ Error running delete script:")
        print(e.stderr)
        return {"success": False, "error": e.stderr}
    except FileNotFoundError as e:
        error_msg = f"PowerShell not found. Please install PowerShell Core (pwsh) on Linux/macOS or ensure powershell.exe is available on Windows. Error: {str(e)}"
        print("❌ PowerShell executable not found:")
        print(error_msg)
        return {"success": False, "error": error_msg}