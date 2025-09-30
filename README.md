# PVE Scripts Local 🚀

A modern web-based management interface for Proxmox VE (PVE) helper scripts. This tool provides a user-friendly way to discover, download, and execute community-sourced Proxmox scripts locally with real-time terminal output streaming.

## 🎯 Deployment Options

This application can be deployed in multiple ways to suit different environments:

- **🐧 Proxmox Host**: Run directly on your Proxmox VE host system
- **📦 Debian LXC Container**: Deploy inside a Debian LXC container for better isolation
- **⚡ Quick Install**: Use the automated `install.sh` script for easy setup

All deployment methods provide the same functionality and web interface.

## 🌟 Features

- **Web-based Interface**: Modern React/Next.js frontend with real-time terminal emulation
- **Script Discovery**: Browse and search through community Proxmox scripts from GitHub
- **One-Click Execution**: Run scripts directly from the web interface with live output
- **Real-time Terminal**: Full terminal emulation with xterm.js for interactive script execution
- **Script Management**: Download, update, and manage local script collections
- **Security**: Sandboxed script execution with path validation and time limits
- **Database Integration**: PostgreSQL backend for script metadata and execution history
- **WebSocket Communication**: Real-time bidirectional communication for script execution
- 

## 🏗️ Architecture

### Frontend
- **Next.js 15** with React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **xterm.js** for terminal emulation
- **tRPC** for type-safe API communication

### Backend
- **Node.js** server with WebSocket support
- **WebSocket Server** for real-time script execution
- **Script Downloader Service** for GitHub integration

### Scripts
- **Core Functions**: Shared utilities and build functions
- **Container Scripts**: Pre-configured LXC container setups
- **Installation Scripts**: System setup and configuration tools

### Database
- **SQLite Database**: Local database stored at `data/settings.db`
- **Server Management**: Stores Proxmox server configurations and credentials
- **Automatic Setup**: Database and tables are created automatically on first run
- **Data Persistence**: Settings persist across application restarts

## 📋 Prerequisites

### For All Deployment Methods
- **Node.js** 22+ and npm
- **Git** for cloning the repository
- **Proxmox VE environment** (host or access to Proxmox cluster)
- **SQLite** (included with Node.js better-sqlite3 package)

### For Proxmox Host Installation
- **build-essentials**: `apt install build-essential`
- Direct access to Proxmox host system

### For Debian LXC Container Installation
- **Debian LXC container** (Debian 11+ recommended)
- **build-essentials**: `apt install build-essential`
- Container with sufficient resources (2GB RAM, 4GB storage minimum)
- Network access from container to Proxmox host
- Optional: Privileged container for full Proxmox integration

### For Quick Install (install.sh)
- **Proxmox VE host** (script automatically detects and configures)
- Internet connectivity for downloading dependencies 

## 🚀 Installation

Choose the installation method that best fits your environment:

### Option 1: Quick Install with install.sh (Recommended for Proxmox Host)

Run this command directly on your Proxmox VE host or on any Debian based lxc:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/michelroegl-brunner/PVESciptslocal/main/install.sh)"
```

**What the script does:**
- ✅ Installs required dependencies (build-essential, git, Node.js 24.x)
- ✅ Clones the repository into `/opt/PVESciptslocal` (or your chosen path)
- ✅ Runs npm install and builds the project
- ✅ Sets up `.env` from `.env.example` if missing
- ✅ Creates database directory (`data/`) for SQLite storage
- ✅ Creates a systemd service (`pvescriptslocal.service`) for easy management

**After installation:**
- 🌐 Access the app at: `http://<YOUR_PVE_OR_LXC_IP>:3000`
- 🔧 Manage the service with:
  ```bash
  systemctl start pvescriptslocal
  systemctl stop pvescriptslocal
  systemctl status pvescriptslocal
  ```

### Option 2: Debian LXC Container Installation

For better isolation and security, you can run PVE Scripts Local inside a Debian LXC container:

#### Step 1: Create Debian LXC Container

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/debian.sh)"
```
Then run the installer:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/michelroegl-brunner/PVESciptslocal/main/install.sh)"
```

#### Step 2: Install Dependencies in Container when installer is not used
```bash
# Enter the container
pct enter 100

# Update and install dependencies
apt update && apt install -y build-essential git curl

# Install Node.js 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
```

#### Step 3: Clone and Setup Application
```bash
# Clone the repository
git clone https://github.com/michelroegl-brunner/PVESciptslocal.git /opt/PVESciptslocal
cd /opt/PVESciptslocal

# Install dependencies and build
npm install
npm run build

# Setup environment
cp .env.example .env

# Create database directory
mkdir -p data
chmod 755 data
```

#### Step 4: Start the Application
```bash
# Start in production mode
npm start

# Or create a systemd service (optional)
# Follow the same systemd setup as the install.sh script
```

**Access the application:**
- 🌐 Container IP: `http://<CONTAINER_IP>:3000`
- 🔧 Container management: `pct start 100`, `pct stop 100`, `pct status 100`

### Option 3: Manual Installation (Proxmox Host)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/michelroegl-brunner/PVESciptslocal.git
cd PVESciptslocal
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Environment Configuration
```bash
cp .env.example .env
# Edit .env file with your specific settings if needed
```

#### Step 4: Database Setup
```bash
# Create database directory
mkdir -p data
chmod 755 data
```

#### Step 5: Build and Start
```bash
# Production mode
npm run build
npm start

# Development mode
npm run dev:server
```

**Access the application:**
- 🌐 Available at: `http://<YOUR_IP>:3000`

## 📝 LXC Container Specific Notes

### Container Requirements
- **OS**: Debian 11+ (Debian 12 recommended)
- **Resources**: Minimum 2GB RAM, 4GB storage
- **Network**: Bridge connection to Proxmox network
- **Privileges**: Unprivileged containers work, but privileged containers provide better Proxmox integration

### Container Configuration Tips
- **Privileged Container**: Use `--unprivileged 0` for full Proxmox API access
- **Resource Allocation**: Allocate at least 2 CPU cores and 2GB RAM for optimal performance
- **Storage**: Use at least 8GB for the container to accommodate Node.js and dependencies
- **Network**: Ensure the container can reach the Proxmox host API

### Security Considerations
- **Unprivileged Containers**: More secure but may have limited Proxmox functionality
- **Privileged Containers**: Full Proxmox access but less secure isolation
- **Network Access**: Ensure proper firewall rules for the container

### Troubleshooting LXC Installation
- **Permission Issues**: Ensure the container has proper permissions for Proxmox API access
- **Network Connectivity**: Verify the container can reach the Proxmox host
- **Resource Limits**: Check if the container has sufficient resources allocated

## 🎯 Usage

### 1. Access the Web Interface

The web interface is accessible regardless of your deployment method:

- **Proxmox Host Installation**: `http://<PROXMOX_HOST_IP>:3000`
- **LXC Container Installation**: `http://<CONTAINER_IP>:3000`
- **Custom Installation**: `http://<YOUR_IP>:3000`

### 2. Service Management

#### For install.sh installations (systemd service):
```bash
# Start the service
systemctl start pvescriptslocal

# Stop the service
systemctl stop pvescriptslocal

# Check service status
systemctl status pvescriptslocal

# Enable auto-start on boot
systemctl enable pvescriptslocal

# View service logs
journalctl -u pvescriptslocal -f
```

#### For LXC container installations:
```bash
# Container management
pct start <container_id>    # Start container
pct stop <container_id>     # Stop container
pct status <container_id>   # Check container status

# Access container shell
pct enter <container_id>

# Inside container - start application
cd /opt/PVESciptslocal
npm start
```

#### For manual installations:
```bash
# Start application
npm start

# Development mode
npm run dev:server

# Build for production
npm run build
```

### 3. Browse Available Scripts

- The main page displays a grid of available Proxmox scripts
- Use the search functionality to find specific scripts
- Scripts are categorized by type (containers, installations, etc.)

### 4. Download Scripts

- Click on any script card to view details
- Use the "Download" button to fetch scripts from GitHub
- Downloaded scripts are stored locally in the `scripts/` directory

### 5. Execute Scripts

- Click "Run Script" on any downloaded script
- A terminal window will open with real-time output
- Interact with the script through the web terminal
- Use the close button to stop execution

### 6. Script Management

- View script execution history
- Update scripts to latest versions
- Manage local script collections

### 7. Database Management

The application uses SQLite for storing server configurations:

- **Database Location**: `data/settings.db`
- **Automatic Creation**: Database and tables are created on first run
- **Server Storage**: Proxmox server credentials and configurations
- **Backup**: Copy `data/settings.db` to backup your server configurations
- **Reset**: Delete `data/settings.db` to reset all server configurations

## 📁 Project Structure

```
PVESciptslocal/
├── scripts/                  # Script collection
│   ├── core/                 # Core utility functions
│   │   ├── build.func        # Build system functions
│   │   ├── tools.func        # Tool installation functions
│   │   └── create_lxc.sh     # LXC container creation
│   ├── ct/                   # Container templates 
│   └── install/              # Installation scripts
├── src/                      # Source code
│   ├── app/                  # Next.js app directory
│   │   ├── _components/      # React components
│   │   └── page.tsx          # Main page
│   └── server/               # Server-side code
│       ├── database.js       # SQLite database service
│       └── services/         # Business logic services
├── data/                     # Database storage
│   └── settings.db           # SQLite database file
├── public/                   # Static assets
├── server.js                 # Main server file
└── package.json              # Dependencies and scripts
```


## 🚀 Development

### Prerequisites for Development
- Node.js 22+
- Git

### Development Commands

```bash
# Install dependencies
npm install
```

# Start development server
```bash
npm run dev:server
```

### Project Structure for Developers

- **Frontend**: React components in `src/app/_components/`
- **Backend**: Server logic in `src/server/`
- **API**: tRPC routers for type-safe API communication
- **Scripts**: Bash scripts in `scripts/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Logs

- Server logs: Check console output or `server.log`
- Script execution: View in web terminal

## 🎯 Quick Start Summary

Choose your preferred deployment method:

| Method | Best For | Command |
|--------|----------|---------|
| **Quick Install** | Proxmox hosts or Debian LXC, easy setup | `bash -c "$(curl -fsSL https://raw.githubusercontent.com/michelroegl-brunner/PVESciptslocal/main/install.sh)"` |
| **LXC Container** | Better isolation, security | Create Debian LXC → Install dependencies → Clone repo → `npm start` |
| **Manual Install** | Custom setups, development | `git clone` → `npm install` → `npm run build` → `npm start` |

All methods provide the same web interface at `http://<IP>:3000` with full Proxmox script management capabilities.

---

**Note**: This is alpha software. Use with caution in production environments and always backup your Proxmox configuration before running scripts.
