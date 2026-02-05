# Setup Guide for Portfolio Tracker

This guide will walk you through setting up your Portfolio Tracker from scratch.

## Prerequisites

You'll need:
- A GitHub account
- Your trading data from FreeTrade and/or Groww
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## Step-by-Step Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub**: Navigate to [github.com](https://github.com) and sign in

2. **Create New Repository**:
   - Click the **"+"** icon in top-right → **"New repository"**
   - Repository name: `portfolio-tracker` (or any name you prefer)
   - Description: "Personal stock portfolio tracking application"
   - Set to **Public** (required for GitHub Pages free hosting)
   - **Do NOT** initialize with README (we'll add our own)
   - Click **"Create repository"**

### Step 2: Upload Application Files

You have two options:

#### Option A: Upload via GitHub Web Interface (Easiest)

1. On your new repository page, click **"uploading an existing file"**
2. Drag and drop ALL files from the `portfolio-tracker` folder:
   - `index.html`
   - `.gitignore`
   - `README.md`
   - `portfolio-data-template.json`
   - All files in `src/` folder (maintain folder structure)
3. Scroll down and click **"Commit changes"**

#### Option B: Upload via Git Command Line

```bash
# Clone your empty repository
git clone https://github.com/YOUR_USERNAME/portfolio-tracker.git
cd portfolio-tracker

# Copy all application files into this directory
# (From wherever you saved them)

# Add all files
git add .

# Commit
git commit -m "Initial commit: Portfolio Tracker application"

# Push to GitHub
git push origin main
```

### Step 3: Enable GitHub Pages

1. In your repository, click **Settings** (top menu)
2. Scroll down to **"Pages"** in left sidebar
3. Under **"Build and deployment"**:
   - Source: **Deploy from a branch**
   - Branch: **main** (or master)
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment

Your site will be available at:
```
https://YOUR_USERNAME.github.io/portfolio-tracker/
```

### Step 4: Test the Application

1. **Open the URL** in your browser
2. You should see:
   - Navigation bar with "Portfolio Tracker" logo
   - "No Data Yet" message
   - "Import Data" button

If you see this, **congratulations!** Your app is working.

### Step 5: Import Your First Data

#### For FreeTrade Users:

1. **Export from FreeTrade**:
   - Open FreeTrade mobile app
   - Tap **Profile** (bottom-right)
   - Tap **History**
   - Tap **Export** button
   - Choose **"Activity Feed"**
   - Select **CSV** format
   - Share/Save the file (`activity-feed-export.csv`)

2. **Import to Portfolio Tracker**:
   - In your Portfolio Tracker, click **"Import Data"**
   - Click the upload area or drag your CSV file
   - Should see: "✓ Detected broker: FreeTrade"
   - Click **"Import Data"** button
   - Wait for processing (may take 10-30 seconds)
   - You'll be redirected to Portfolio view

#### For Groww Users:

1. **Export from Groww**:
   - Open Groww app or website
   - Go to **Dashboard** → **Stocks**
   - Click **Orders** tab
   - Click **Export** or **Download** icon
   - Save the file

2. **Import to Portfolio Tracker**:
   - Same steps as FreeTrade above
   - Should detect: "✓ Detected broker: Groww"

### Step 6: Verify Your Data

After import, you should see:
- **Portfolio Value KPI**: Showing total value and profit/loss
- **Holdings Table**: List of all your stocks
- **Refresh Prices** button: Click to update latest prices

Click any stock to see:
- Detailed metrics
- Price chart
- Transaction history

## Data Backup Strategy

### Regular Backups (Recommended Weekly)

1. **Export Data**:
   - Click **"Export Data"** button in navigation
   - Downloads `portfolio-data-YYYY-MM-DD.json`

2. **Commit to GitHub**:
   ```bash
   # In your local repository folder
   git add portfolio-data-*.json
   git commit -m "Weekly portfolio backup"
   git push
   ```

3. **Alternative**: Store in cloud storage (Dropbox, Google Drive, etc.)

### Restore from Backup

1. Go to **Import Data** page
2. Scroll to **"Data Management"** section
3. Click **"Import from JSON"**
4. Select your backup file
5. Data will be restored

## Updating the Application

When new features are released:

```bash
# In your local repository
git pull origin main

# Review changes
git log

# Push to GitHub
git push

# GitHub Pages will auto-deploy
```

## Customization

### Update Corporate Actions

If you have stocks that split or were acquired:

1. Open `src/data/brokerMappings.js` in GitHub
2. Click **Edit** (pencil icon)
3. Add your corporate action:

```javascript
// Stock split example
window.CORPORATE_ACTIONS.splits['YOUR_TICKER'] = 2; // 2-for-1 split

// Acquisition/delisting example  
window.CORPORATE_ACTIONS.autoExits['YOUR_TICKER'] = {
  amount: 150.00,
  reason: 'Acquired at £150 per share'
};
```

4. **Commit changes**
5. Wait 1-2 minutes for GitHub Pages to redeploy

### Change Color Theme

Edit the color classes in components:
- `bg-blue-600` → `bg-purple-600` (change blue to purple)
- `text-blue-700` → `text-purple-700`

## Troubleshooting

### Problem: "No Data Yet" after import

**Solutions**:
1. Check browser console (F12) for errors
2. Verify CSV file is from FreeTrade or Groww
3. Try clearing browser cache and re-importing
4. Check if file has headers in first row

### Problem: Prices showing as "-"

**Solutions**:
1. Click **"Refresh Prices"** button
2. Wait 5 minutes (Yahoo Finance rate limit)
3. Check internet connection
4. Some stocks may not be available on Yahoo Finance

### Problem: GitHub Pages not updating

**Solutions**:
1. Wait 2-5 minutes after commit
2. Check **Settings** → **Pages** for build status
3. Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache

### Problem: Import fails with error

**Common Issues**:
1. File encoding: Ensure CSV is UTF-8 encoded
2. File size: Very large files (>5MB) may timeout
3. Corrupted file: Re-export from broker
4. Wrong format: Verify it's from supported broker

## Security Notes

- ✅ All data stored locally in browser
- ✅ No data sent to external servers (except Yahoo Finance for prices)
- ✅ GitHub Pages is static hosting (no server-side code)
- ⚠️ Public repository means code is public (but your data is not)
- ⚠️ Don't commit sensitive data files to public repository

To make repository private:
1. **Settings** → **General**
2. Scroll to **"Danger Zone"**
3. **"Change visibility"** → **Private**
4. Note: GitHub Pages on private repos requires paid plan

## Getting Help

If you encounter issues:

1. **Check the README.md** for common solutions
2. **Browser Console**: Press F12 and check Console tab for errors
3. **GitHub Issues**: Create an issue in your repository
4. **Clear and Re-import**: Last resort - clear all data and start fresh

## Next Steps

Now that your portfolio tracker is set up:

1. ✅ Import all your trading history
2. ✅ Set up weekly backup routine
3. ✅ Customize corporate actions if needed
4. ✅ Bookmark your tracker URL
5. ✅ Monitor your portfolio performance!

---

**Congratulations!** You now have a fully functional portfolio tracker running on GitHub Pages. 🎉
