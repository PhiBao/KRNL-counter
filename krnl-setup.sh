#!/bin/bash

# KRNL Counter Test Setup Script
# This script initializes, compiles, and deploys the Counter contract using KRNL CLI

set -e  # Exit on error

echo "🚀 KRNL Counter Test - Setup and Deploy"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with PRIVATE_KEY and SEPOLIA_RPC_URL"
    echo "Use .env.example as template"
    exit 1
fi

# Load environment variables
source .env

# Check if KRNL CLI is installed
if ! command -v krnl &> /dev/null; then
    echo "📦 Installing KRNL CLI..."
    npm install -g @krnl-dev/krnl-cli
else
    echo "✅ KRNL CLI already installed"
fi

# Initialize project (if not already initialized)
if [ ! -f "foundry.toml" ]; then
    echo "🔧 Initializing KRNL project..."
    krnl init
else
    echo "✅ Project already initialized"
fi

# Compile contracts
echo "🔨 Compiling contracts..."
krnl compile

# Deploy to Sepolia with verification
echo "🚀 Deploying Counter contract to Sepolia..."
echo "⚠️  Make sure you have Sepolia ETH in your wallet!"
read -p "Press Enter to continue with deployment..."

krnl deploy --network sepolia --script script/Deploy.s.sol:Deploy --verify

echo ""
echo "✅ Deployment complete!"
echo "📝 Check the output above for the deployed contract address"
echo "🔍 Contract should be verified on Sepolia Etherscan"
echo ""
echo "Next steps:"
echo "1. Copy the deployed contract address"
echo "2. Update COUNTER_ADDRESS in .env"
echo "3. Run: node counter-interact.js"
