#!/bin/bash
# Setup git hooks for the project

echo "🔧 Setting up git hooks..."

# Get project root
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Set git hooks directory
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/*

echo "✅ Git hooks configured!"
echo ""
echo "📋 Installed hooks:"
ls -1 .githooks/ | sed 's/^/  - /'
echo ""
echo "ℹ️  Hooks will run automatically on:"
echo "  - pre-commit: Before each commit (runs tests & linting)"
echo ""
echo "💡 To skip hooks (not recommended):"
echo "  git commit --no-verify"
