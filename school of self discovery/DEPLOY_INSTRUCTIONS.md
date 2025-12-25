# GitHub Pages Deployment - Branch Method

## Quick Setup (One Time)

### Step 1: Enable GitHub Pages
1. Go to: https://github.com/ColourfulRhythm/sosd/settings/pages
2. Under **"Source"**, select: **"Deploy from a branch"**
3. Select branch: **`gh-pages`**
4. Select folder: **`/ (root)`**
5. Click **Save**

### Step 2: Set Custom Domain (Optional)
1. In the same Pages settings, scroll to **"Custom domain"**
2. Enter your domain (e.g., `www.yourdomain.com` or `yourdomain.com`)
3. Click **Save**
4. Update the `CNAME` file in the repository with your domain
5. Add DNS records at your domain provider:
   - Type: `CNAME`
   - Name: `www` (or `@` for root domain)
   - Value: `colourfulrhythm.github.io`

## Deploy Your Site

### Option 1: Use the Deploy Script (Easiest)
```bash
cd "school of self discovery"
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# Build the site
npm run build

# Create gh-pages branch
git checkout -b gh-pages
git checkout main

# Copy built files
cp -r out/* .
cp CNAME .
cp .nojekyll .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force

# Switch back to main
git checkout main
```

## After Deployment
- Your site will be live at: `https://colourfulrhythm.github.io/sosd/`
- Or your custom domain if configured
- Updates take 1-2 minutes to go live

## Notes
- The `out/` folder contains your built site
- The `CNAME` file is for custom domains
- The `.nojekyll` file tells GitHub not to process with Jekyll

