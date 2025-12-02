import subprocess
import sys
import os

# Configuration
pi_host = "192.168.1.7"
pi_user = "pisoprint"
pi_password = "pisoprint"
local_build_dir = r"C:\xampp3\htdocs\pisoprint\public\build"
remote_temp_dir = "/tmp/build"
remote_final_dir = "/var/www/pisoprint/public/build"

print("🚀 Starting automated build transfer to Raspberry Pi...")

# Method 1: Try using subprocess with password automation
try:
    # Install paramiko if not available
    try:
        import paramiko
        print("✓ Paramiko found, using SSH/SCP")
    except ImportError:
        print("Installing paramiko for secure file transfer...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
        import paramiko
    
    # Create SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {pi_user}@{pi_host}...")
    ssh.connect(pi_host, username=pi_user, password=pi_password, timeout=10)
    print("✓ Connected successfully!")
    
    # Create SFTP client
    sftp = ssh.open_sftp()
    
    # Function to upload directory recursively
    def upload_dir(local_dir, remote_dir):
        print(f"Uploading {local_dir} to {remote_dir}...")
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            sftp.mkdir(remote_dir)
        
        for item in os.listdir(local_dir):
            local_path = os.path.join(local_dir, item)
            remote_path = f"{remote_dir}/{item}"
            
            if os.path.isfile(local_path):
                print(f"  Uploading {item}...")
                sftp.put(local_path, remote_path)
            elif os.path.isdir(local_path):
                try:
                    sftp.stat(remote_path)
                except FileNotFoundError:
                    sftp.mkdir(remote_path)
                upload_dir(local_path, remote_path)
    
    # Remove old build directory on Pi
    print("Removing old build directory...")
    stdin, stdout, stderr = ssh.exec_command(f"sudo rm -rf {remote_temp_dir}")
    stdout.channel.recv_exit_status()
    
    # Upload files
    upload_dir(local_build_dir, remote_temp_dir)
    
    print("✓ Files uploaded to /tmp/build")
    
    # Move to final location and set permissions
    print("Moving files to final location...")
    commands = [
        f"sudo rm -rf {remote_final_dir}",
        f"sudo mv {remote_temp_dir} {remote_final_dir}",
        f"sudo chown -R www-data:www-data {remote_final_dir}"
    ]
    
    for cmd in commands:
        print(f"  Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            error = stderr.read().decode()
            print(f"  ⚠️ Warning: {error}")
    
    # Close connections
    sftp.close()
    ssh.close()
    
    print("\n✅ SUCCESS! Build files transferred successfully!")
    print(f"\n🌐 Your application is now accessible at: http://{pi_host}")
    print("\nNext steps:")
    print("  1. Open browser to http://192.168.1.7")
    print("  2. Test the application")
    print("  3. Follow deployment guide for additional setup")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nFalling back to manual transfer instructions...")
    print("\nPlease use WinSCP to transfer files:")
    print("  1. Download: https://winscp.net/eng/download.php")
    print(f"  2. Connect to: {pi_host}")
    print(f"  3. Username: {pi_user}")
    print(f"  4. Password: {pi_password}")
    print(f"  5. Upload {local_build_dir} to /var/www/pisoprint/public/")
    sys.exit(1)
