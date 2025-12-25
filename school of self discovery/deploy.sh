#!/bin/bash

# Build the site
echo "Building site..."
npm run build

# Create or checkout gh-pages branch
echo "Preparing gh-pages branch..."
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Copy built files to root
echo "Copying built files..."
cp -r out/* .
cp CNAME . 2>/dev/null || true
cp .nojekyll . 2>/dev/null || true

# Commit and push
echo "Committing and pushing..."
git add .
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"
git push origin gh-pages --force

# Switch back to main
echo "Switching back to main branch..."
git checkout main

echo "✅ Deployment complete! Your site should be live in a few minutes."

