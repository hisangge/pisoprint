# Fix File Upload Size Limit

## Problem
Your PHP configuration only allows 2MB uploads, but your PDF is 2.3MB.

## Solution
Edit the Herd PHP configuration file to increase upload limits.

### Steps:

1. **Open the php.ini file in Notepad:**
   ```
   notepad C:\Users\Leodyver\.config\herd\bin\php83\php.ini
   ```

2. **Find and change these settings** (use Ctrl+F to search):
   
   Find:
   ```ini
   upload_max_filesize = 2M
   post_max_size = 2M
   ```
   
   Change to:
   ```ini
   upload_max_filesize = 50M
   post_max_size = 50M
   max_execution_time = 300
   ```

3. **Save the file** (Ctrl+S)

4. **Restart Herd:**
   - Open Herd app from system tray
   - Click "Stop" then "Start"
   
   OR run in PowerShell:
   ```powershell
   herd restart
   ```

5. **Verify the change:**
   ```powershell
   php -i | findstr "upload_max_filesize"
   php -i | findstr "post_max_size"
   ```
   
   Should now show 50M

## Done!
Now you can upload PDF files up to 50MB.

The application will also show a friendly error message if the file is still too large.
