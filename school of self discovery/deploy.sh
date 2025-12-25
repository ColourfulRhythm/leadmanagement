#!/bin/bash

# Get the repo root directory
REPO_ROOT=$(git rev-parse --show-toplevel)
PROJECT_DIR="$REPO_ROOT/school of self discovery"

# Build the site
echo "Building site..."
cd "$PROJECT_DIR"
npm run build

# Switch to gh-pages branch
echo "Preparing gh-pages branch..."
cd "$REPO_ROOT"
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Remove everything except .git
echo "Cleaning gh-pages branch..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'school of self discovery' -exec rm -rf {} +
rm -rf "school of self discovery"

# Copy built files to repo root
echo "Copying built files to root..."
cp -r "$PROJECT_DIR/out"/* .
cp "$PROJECT_DIR/.nojekyll" . 2>/dev/null || touch .nojekyll

# Commit and push
echo "Committing and pushing..."
git add .
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"
git push origin gh-pages --force

# Switch back to main
echo "Switching back to main branch..."
git checkout main

echo "✅ Deployment complete! Your site should be live at: https://colourfulrhythm.github.io/sosd/"
