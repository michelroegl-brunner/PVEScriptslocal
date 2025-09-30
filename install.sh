#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# Installer for PVESciptslocal with systemd integration
# ------------------------------------------------------------------------------



# --- Core ---------------------------------------------------------------------
RD=$(echo -e "\033[01;31m")
GN=$(echo -e "\033[1;92m")
YW=$(echo -e "\033[33m")
CL=$(echo -e "\033[m")

msg_info() { echo -e "⏳ $YW$1$CL"; }
msg_ok()   { echo -e "✔️  $GN$1$CL"; }
msg_err()  { echo -e "❌ $RD$1$CL"; }



# --- Dependency Check & Install -----------------------------------------------
check_dependencies() {
  msg_info "Checking required packages (build-essential, git)..."
  apt-get update
  apt-get install -y build-essential git sshpass expect
  msg_ok "Dependencies installed."
}

check_nodejs() {
  if ! command -v node >/dev/null 2>&1; then
    msg_info "Node.js not found, installing Node.js 24.x..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
    msg_ok "Node.js installed: $(node -v)"
  else
    msg_ok "Node.js already available: $(node -v)"
  fi
}

# --- Repository Handling ------------------------------------------------------
clone_or_update_repo() {
  read -rp "Installation directory [default: /opt/PVESciptslocal]: " INSTALL_DIR
  INSTALL_DIR=${INSTALL_DIR:-/opt/PVESciptslocal}

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
}

# --- Application Setup --------------------------------------------------------
setup_app() {
  msg_info "Installing npm dependencies..."
  npm install
  msg_ok "Dependencies installed."

  if [ ! -f .env ]; then
    msg_info "Creating environment file from example..."
    cp .env.example .env
    msg_ok ".env file created."
  else
    msg_ok ".env file already exists, keeping it."
  fi

  msg_info "Setting up database directory..."
  mkdir -p data
  chmod 755 data
  msg_ok "Database directory created."

  msg_info "Building application..."
  npm run build
  msg_ok "Build completed."
}

# --- Systemd Service ----------------------------------------------------------
setup_systemd_service() {
  SERVICE_NAME="pvescriptslocal"
  SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

  msg_info "Creating systemd service at $SERVICE_FILE..."
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=PVEScriptslocal Service
After=network.target

[Service]
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
User=root

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reexec
  msg_ok "Systemd service created."

  read -rp "Enable and start the service now? (y/N): " START_SERVICE
  if [[ "$START_SERVICE" =~ ^[Yy]$ ]]; then
    systemctl enable --now "$SERVICE_NAME"
    msg_ok "Service enabled and started."
  else
    msg_info "You can start it manually with: systemctl start $SERVICE_NAME"
  fi

  echo
  echo "---------------------------------------------"
  echo " Service installed: $SERVICE_NAME"
  echo " Manage it with:"
  echo "   systemctl start  $SERVICE_NAME"
  echo "   systemctl stop   $SERVICE_NAME"
  echo "   systemctl status $SERVICE_NAME"
  echo " App will be available at: http://<IP>:3000"
  echo "---------------------------------------------"
}

# --- Main ---------------------------------------------------------------------
main() {
  check_pve
  check_dependencies
  check_nodejs
  clone_or_update_repo
  setup_app
  setup_systemd_service
}

main "$@"

