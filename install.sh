#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Installer for PVESciptslocal
# ------------------------------------------------------------------------------

set -euo pipefail

# Colors
RD=$(echo -e "\033[01;31m")
GN=$(echo -e "\033[1;92m")
YW=$(echo -e "\033[33m")
CL=$(echo -e "\033[m")

# Status functions
msg_info() { echo -e "⏳ $YW$1$CL"; }
msg_ok()   { echo -e "✔️  $GN$1$CL"; }
msg_err()  { echo -e "❌ $RD$1$CL"; }

# --- Check Proxmox VE environment ---
if ! command -v pveversion >/dev/null 2>&1; then
  msg_err "This script must be executed on a Proxmox VE host."
  exit 1
fi
msg_ok "Proxmox VE detected: $(pveversion)"

# --- Check git ---
if ! command -v git >/dev/null 2>&1; then
  msg_info "Git not found, installing..."
  apt-get update
  apt-get install -y git
  msg_ok "Git installed: $(git --version)"
else
  msg_ok "Git already available: $(git --version)"
fi

# --- Check Node.js ---
if ! command -v node >/dev/null 2>&1; then
  msg_info "Node.js not found, installing Node.js 24.x..."
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
  msg_ok "Node.js installed: $(node -v)"
else
  msg_ok "Node.js already available: $(node -v)"
fi

# --- Ask for installation path ---
read -rp "Installation directory [default: /opt/PVESciptslocal]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/opt/PVESciptslocal}

# --- Clone or update repository ---
if [ ! -d "$INSTALL_DIR/.git" ]; then
  msg_info "Cloning repository into $INSTALL_DIR..."
  git clone https://github.com/michelroegl-brunner/PVESciptslocal.git "$INSTALL_DIR"
  msg_ok "Repository cloned."
else
  msg_info "Directory already exists. Pulling latest changes..."
  git -C "$INSTALL_DIR" pull
  msg_ok "Repository updated."
fi

cd "$INSTALL_DIR"

# --- Install dependencies ---
msg_info "Installing dependencies..."
npm install
msg_ok "Dependencies installed."

# --- Environment file ---
if [ ! -f .env ]; then
  msg_info "Creating environment file from example..."
  cp .env.example .env
  msg_ok ".env file created."
else
  msg_ok ".env file already exists, keeping it."
fi

# --- Build the application ---
msg_info "Building application..."
npm run build
msg_ok "Build completed."

# --- Start the application ---
read -rp "Do you want to start the application now? (y/N): " START_APP
if [[ "$START_APP" =~ ^[Yy]$ ]]; then
  msg_info "Starting application..."
  npm start
else
  msg_info "You can start the app anytime by running: cd $INSTALL_DIR && npm start"
fi
