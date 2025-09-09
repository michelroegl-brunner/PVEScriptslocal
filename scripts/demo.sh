#!/bin/bash

# Demo script for PVE Scripts Local Management
# This script demonstrates live output streaming

echo "🚀 Starting PVE Script Demo..."
echo "================================"
echo ""

echo "📋 System Information:"
echo "  - Hostname: $(hostname)"
echo "  - User: $(whoami)"
echo "  - Date: $(date)"
echo "  - Uptime: $(uptime)"
echo ""

echo "🔧 Simulating Proxmox operations..."
echo "  - Checking Proxmox API connection..."
sleep 2
echo "  ✅ API connection successful"
echo ""

echo "  - Listing VMs..."
sleep 1
echo "  📦 VM 100: Ubuntu Server 22.04 (running)"
echo "  📦 VM 101: Windows Server 2022 (stopped)"
echo "  📦 VM 102: Debian 12 (running)"
echo ""

echo "  - Checking storage..."
sleep 1
echo "  💾 Local storage: 500GB (200GB used)"
echo "  💾 NFS storage: 2TB (800GB used)"
echo ""

echo "  - Checking cluster status..."
sleep 1
echo "  🏗️  Node: pve-01 (online)"
echo "  🏗️  Node: pve-02 (online)"
echo "  🏗️  Node: pve-03 (maintenance)"
echo ""

echo "🎯 Demo completed successfully!"
echo "================================"
echo "This script ran for demonstration purposes."
echo "In a real scenario, this would perform actual Proxmox operations."
