import paramiko
import os
import sys
from pathlib import Path

# Configuration
pi_host = "192.168.1.7"
pi_user = "pisoprint"
pi_password = "pisoprint"
local_app_dir = r"C:\xampp3\htdocs\pisoprint"
remote_temp_dir = "/tmp/pisoprint"
remote_final_dir = "/var/www/pisoprint"

# Folders/files to exclude
exclude_patterns = [
    'node_modules',
    '.git',
    '.env',
    'storage/logs',
    'storage/framework/cache',
    'storage/framework/sessions', 
    'storage/framework/views',
    'pisoprint-deployment.tar.gz',
    'transfer_build.py'
]

def should_exclude(path):
    """Check if path should be excluded"""
    path_str = str(path).replace('\\', '/')
    for pattern in exclude_patterns:
        if pattern in path_str:
            return True
    return False

def upload_directory(sftp, local_dir, remote_dir):
    """Recursively upload directory"""
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        
        if should_exclude(local_path):
            continue
            
        if os.path.isfile(local_path):
            print(f"  Uploading: {item}")
            try:
                sftp.put(local_path, remote_path)
            except Exception as e:
                print(f"    Warning: {e}")
        elif os.path.isdir(local_path):
            upload_directory(sftp, local_path, remote_path)

print("🚀 Deploying Complete PisoPrint Application to Raspberry Pi")
print("=" * 60)
print(f"Source: {local_app_dir}")
print(f"Target: {pi_host}:{remote_final_dir}")
print("=" * 60)

try:
    # Connect
    print("\n📡 Connecting to Pi...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(pi_host, username=pi_user, password=pi_password, timeout=10)
    print("✓ Connected!")
    
    sftp = ssh.open_sftp()
    
    # Clean up old deployment
    print("\n🗑️  Cleaning old deployment...")
    stdin, stdout, stderr = ssh.exec_command(f"sudo rm -rf {remote_temp_dir} {remote_final_dir}")
    stdout.channel.recv_exit_status()
    print("✓ Cleaned!")
    
    # Upload application
    print(f"\n📦 Uploading application (this will take a few minutes)...")
    upload_directory(sftp, local_app_dir, remote_temp_dir)
    print("✓ Upload complete!")
    
    # Move to final location and set permissions
    print("\n⚙️  Configuring application...")
    commands = [
        f"sudo mkdir -p {remote_final_dir}",
        f"sudo mv {remote_temp_dir}/* {remote_final_dir}/",
        f"sudo chown -R www-data:www-data {remote_final_dir}",
        f"sudo chmod -R 755 {remote_final_dir}",
        f"sudo chmod -R 775 {remote_final_dir}/storage {remote_final_dir}/bootstrap/cache",
    ]
    
    for cmd in commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    
    print("✓ Permissions set!")
    
    # Close connections
    sftp.close()
    ssh.close()
    
    print("\n" + "=" * 60)
    print("✅ DEPLOYMENT SUCCESSFUL!")
    print("=" * 60)
    print("\n📋 Next: SSH to Pi and run deployment script:")
    print("   ssh pisoprint@192.168.1.7")
    print("   cd /var/www/pisoprint")
    print("   bash scripts/complete-setup.sh")
    print("\n🌐 Application will be available at: http://192.168.1.7")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
