import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Windows Security Helper for handling native Windows dialogs
 * Uses PowerShell UIAutomation to interact with Windows Security passkey dialog
 */
export class WindowsSecurityHelper {
  
  /**
   * Enter PIN in Windows Security passkey dialog
   */
  static async enterPINInWindowsSecurityDialog(pin: string): Promise<boolean> {
    console.log('🔐 Attempting to enter PIN in Windows Security dialog...');
    
    const powershellScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName UIAutomationClient
      Add-Type -AssemblyName UIAutomationTypes
      
      $retryCount = 0
      $maxRetries = 30
      $found = $false
      
      while ($retryCount -lt $maxRetries -and -not $found) {
        Start-Sleep -Milliseconds 500
        
        # Find Windows Security window
        $windows = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
          [System.Windows.Automation.TreeScope]::Children,
          [System.Windows.Automation.Condition]::TrueCondition
        )
        
        foreach ($window in $windows) {
          $windowName = $window.Current.Name
          if ($windowName -like "*Windows Security*" -or $windowName -like "*Sign in*") {
            Write-Host "Found Windows Security window: $windowName"
            
            # Find the PIN input field (password field)
            $condition = New-Object System.Windows.Automation.PropertyCondition(
              [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
              [System.Windows.Automation.ControlType]::Edit
            )
            
            $pinInput = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
            
            if ($pinInput) {
              Write-Host "Found PIN input field"
              
              # Set focus and enter PIN
              $pinInput.SetFocus()
              Start-Sleep -Milliseconds 500
              
              # Use SendKeys to type the PIN
              [System.Windows.Forms.SendKeys]::SendWait("${pin}")
              Start-Sleep -Milliseconds 500
              
              # Press Enter
              [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
              
              Write-Host "PIN entered successfully"
              $found = $true
              break
            }
          }
        }
        
        $retryCount++
      }
      
      if ($found) {
        Write-Host "SUCCESS"
        exit 0
      } else {
        Write-Host "FAILED: Windows Security dialog not found after 15 seconds"
        exit 1
      }
    `;
    
    try {
      const { stdout, stderr } = await execPromise(
        `powershell.exe -ExecutionPolicy Bypass -Command "${powershellScript.replace(/"/g, '\\"')}"`,
        { timeout: 20000 }
      );
      
      console.log('PowerShell output:', stdout);
      
      if (stdout.includes('SUCCESS') || stdout.includes('PIN entered successfully')) {
        console.log('✅ PIN entered in Windows Security dialog');
        return true;
      } else {
        console.log('⚠️ Failed to enter PIN in Windows Security dialog');
        console.error('PowerShell error:', stderr);
        return false;
      }
    } catch (error) {
      console.error('❌ Error running PowerShell script:', error);
      return false;
    }
  }
  
  /**
   * Check if Windows Security dialog is present
   */
  static async isWindowsSecurityDialogPresent(): Promise<boolean> {
    const script = `
      Add-Type -AssemblyName UIAutomationClient
      $windows = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Children,
        [System.Windows.Automation.Condition]::TrueCondition
      )
      foreach ($window in $windows) {
        $name = $window.Current.Name
        if ($name -like "*Windows Security*" -or $name -like "*passkey*") {
          Write-Host "FOUND"
          exit 0
        }
      }
      Write-Host "NOT_FOUND"
      exit 1
    `;
    
    try {
      const { stdout } = await execPromise(
        `powershell.exe -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`,
        { timeout: 5000 }
      );
      return stdout.includes('FOUND');
    } catch {
      return false;
    }
  }
}
