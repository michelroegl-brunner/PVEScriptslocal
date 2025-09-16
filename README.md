# PVE Scripts Local 🚀

A modern web-based management interface for Proxmox VE (PVE) helper scripts. This tool provides a user-friendly way to discover, download, and execute community-sourced Proxmox scripts locally with real-time terminal output streaming.

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

## 📋 Prerequisites

- **Node.js** 22+ and npm
- **Git** for cloning the repository
- **Proxmox VE environment**
- **build-essentials** ```apt install build-essential``` 

## 🚀 Installation

You can either install automatically via the provided installer script or do a manual setup.

### Option 1: Install via Bash (Recommended)

Run this command directly on your Proxmox VE host:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/michelroegl-brunner/PVESciptslocal/main/installer.sh)"
```

## The script will:
- Verify that you are running on Proxmox VE
- Check and install git and Node.js 24.x if missing
- Clone the repository into /opt/PVESciptslocal (or your chosen path)
- Run npm install and build the project
- Set up .env from .env.example if missing
- Create a systemd service (pvescriptslocal.service) for easy start/stop management

After installation, the app will be accessible at:
👉 http://<YOUR_PVE_IP>:3000

You can manage the service with:
```bash
systemctl start pvescriptslocal
systemctl stop pvescriptslocal
systemctl status pvescriptslocal
```


### Option 2: Manual Installation

### 1. Clone the Repository

```bash
git clone https://github.com/michelroegl-brunner/PVESciptslocal.git
cd PVESciptslocal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

### 4. Start the Application

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://IP:3000`

## 🎯 Usage

### 1. Access the Web Interface

Open your browser and navigate to `http://IP:3000` (or your configured host/port).

### 2. Browse Available Scripts

- The main page displays a grid of available Proxmox scripts
- Use the search functionality to find specific scripts
- Scripts are categorized by type (containers, installations, etc.)

### 3. Download Scripts

- Click on any script card to view details
- Use the "Download" button to fetch scripts from GitHub
- Downloaded scripts are stored locally in the `scripts/` directory

### 4. Execute Scripts

- Click "Run Script" on any downloaded script
- A terminal window will open with real-time output
- Interact with the script through the web terminal
- Use the close button to stop execution

### 5. Script Management

- View script execution history
- Update scripts to latest versions
- Manage local script collections

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
│       └── services/         # Business logic services
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

---

**Note**: This is alpha software. Use with caution in production environments and always backup your Proxmox configuration before running scripts.
