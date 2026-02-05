# Portfolio Tracker

A comprehensive web application for tracking your stock portfolio across multiple brokers (FreeTrade UK and Groww India). Built with React and designed to be hosted on GitHub Pages.

![Portfolio Tracker](https://img.shields.io/badge/version-1.0.0-blue)

## Features

### 📊 Portfolio Dashboard
- **Real-time KPIs**: Current portfolio value, total invested, profit/loss (£ and %)
- **Holdings List**: View all your current positions with sortable columns
- **Live Price Updates**: Automatically fetches latest stock prices from Yahoo Finance
- **Multi-broker Support**: Seamlessly combines data from FreeTrade and Groww

### 📈 Individual Stock Analysis
- **Detailed Metrics**: Current price, shares held, average cost, total profit/loss
- **Price Charts**: Interactive historical price charts with multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- **Activity History**: Complete transaction history including buys, sells, and dividends
- **Day Change Tracking**: See how each position performed today

### 📥 Smart Data Import
- **Auto-Detection**: Automatically detects FreeTrade or Groww CSV/Excel formats
- **Corporate Actions**: Handles stock splits, conversions, and delistings
- **Duplicate Prevention**: Intelligently merges new data with existing records
- **Flexible Formats**: Supports both CSV and Excel (.xlsx, .xls) files

### 💾 Data Management
- **Local Storage**: All data stored in your browser (no cloud, no privacy concerns)
- **JSON Export/Import**: Back up your data to GitHub or any location
- **Data Persistence**: Your data persists across browser sessions

## Quick Start

### 1. Clone this Repository

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-tracker.git
cd portfolio-tracker
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

Your app will be available at: `https://YOUR_USERNAME.github.io/portfolio-tracker/`

### 3. Import Your Data

1. Open the app in your browser
2. Click **"Import Data"** in the navigation
3. Upload your CSV/Excel file from FreeTrade or Groww
4. Click **"Import Data"** button
5. Navigate back to **"Portfolio"** to view your holdings

## Supported Brokers

### FreeTrade (UK)
**How to Export:**
1. Open FreeTrade app
2. Go to **Profile** → **History**
3. Tap **Export** → **Activity Feed**
4. Choose **CSV** format
5. Upload the `activity-feed-export.csv` file

**Supported Data:**
- Buy/Sell orders
- Dividends
- Interest
- Top-ups and withdrawals
- Corporate actions

### Groww (India)
**How to Export:**
1. Open Groww app or website
2. Go to **Stocks** → **Orders**
3. Click **Export** or **Download**
4. Choose **CSV** or **Excel** format
5. Upload the file

**Supported Data:**
- Buy/Sell orders
- NSE and BSE stocks
- Order history with execution details

## Corporate Actions Supported

The app automatically handles:

### Stock Conversions
- Credit Suisse (CS) → UBS
- Cellular Goods (CBX) → Cel AI (CLAI)

### Stock Splits
- Amazon (AMZN): 20-to-1 split
- Nvidia (NVDA): 10-to-1 split
- Netflix (NFLX): 10-to-1 split
- GSK: 4-for-5 split
- And more...

### Auto-Exited Stocks
Stocks that were acquired or delisted:
- YMAB (Y-mAbs Therapeutics)
- BLUE (bluebird bio)
- HEIT (Heiq)
- LTG (Learning Technologies)

## Technology Stack

- **React 18**: Modern UI framework
- **React Router**: Client-side routing
- **Recharts**: Interactive charts
- **Tailwind CSS**: Utility-first styling
- **PapaParse**: CSV parsing
- **SheetJS (XLSX)**: Excel file handling
- **Yahoo Finance API**: Real-time stock prices

## File Structure

```
portfolio-tracker/
├── index.html                      # Main HTML file
├── src/
│   ├── App.jsx                     # Main app component with routing
│   ├── components/
│   │   ├── Navigation.jsx          # Top navigation bar
│   │   ├── Portfolio.jsx           # Portfolio dashboard
│   │   ├── HoldingDetail.jsx       # Individual stock view
│   │   └── ImportData.jsx          # CSV/Excel import page
│   ├── utils/
│   │   ├── stockApi.js             # Yahoo Finance integration
│   │   ├── dataProcessor.js        # Data transformation logic
│   │   └── corporateActions.js     # Corporate actions handling
│   └── data/
│       └── brokerMappings.js       # Broker-specific mappings
└── README.md                       # This file
```

## Data Storage

### Browser LocalStorage
All your data is stored locally in your browser using localStorage:
- `allData`: All imported transactions and activities
- `holdings`: Calculated current holdings
- `price_*`: Cached stock prices (5-minute expiry)

### JSON Backup to GitHub

1. **Export Data**:
   - Click **"Export Data"** button in navigation
   - Downloads `portfolio-data-YYYY-MM-DD.json`

2. **Commit to GitHub**:
   ```bash
   git add portfolio-data-*.json
   git commit -m "Backup portfolio data"
   git push
   ```

3. **Import Data**:
   - Click **"Import Data"** page
   - Scroll to **"Data Management"** section
   - Click **"Import from JSON"**
   - Select your backup file

## Customization

### Adding New Corporate Actions

Edit `src/data/brokerMappings.js`:

```javascript
// Add stock conversion
window.CORPORATE_ACTIONS.conversions['OLD_TICKER'] = {
  newSymbol: 'NEW_TICKER',
  oldTitle: 'Old Company',
  newTitle: 'New Company',
  ratio: 0.5, // 1 old share = 0.5 new shares
  date: '2024-01-01T00:00:00Z'
};

// Add stock split
window.CORPORATE_ACTIONS.splits['TICKER'] = 10; // 10-to-1 split

// Add auto-exited stock
window.CORPORATE_ACTIONS.autoExits['TICKER'] = {
  amount: 100.50,
  reason: 'Acquired at £100.50'
};
```

### Adding New Brokers

1. Add mapping to `src/data/brokerMappings.js`:

```javascript
window.BROKER_MAPPINGS.NEW_BROKER = {
  name: 'New Broker',
  detect: (headers) => headers.includes('UniqueColumn'),
  mapping: {
    title: 'StockName',
    ticker: 'Symbol',
    // ... map all required fields
  },
  typeMapping: {
    'BUY': 'TRADE',
    'SELL': 'TRADE'
  }
};
```

## Troubleshooting

### Prices Not Loading
- **Issue**: Yahoo Finance API may have rate limits or CORS issues
- **Solution**: Wait a few minutes and click "Refresh Prices"
- **Alternative**: Prices are cached for 5 minutes to reduce API calls

### Data Not Persisting
- **Issue**: Browser may clear localStorage
- **Solution**: Export data regularly as JSON backup to GitHub

### Import Failed
- **Issue**: CSV format not recognized
- **Solution**: Ensure file is from FreeTrade or Groww
- **Check**: File must have proper headers and data

### Chart Not Displaying
- **Issue**: Historical data not available for stock
- **Solution**: This is normal for some stocks; data depends on Yahoo Finance availability

## Privacy & Security

- ✅ **100% Local**: All data stored in your browser
- ✅ **No Cloud Storage**: No data sent to any server (except Yahoo Finance API for prices)
- ✅ **No Tracking**: No analytics or tracking scripts
- ✅ **Open Source**: Full transparency - review the code yourself

## Roadmap

Future enhancements planned:
- [ ] Sold holdings view (historical positions)
- [ ] Portfolio performance over time graph
- [ ] Dividend tracking and forecasting
- [ ] Multi-currency support with FX rates
- [ ] Export to PDF/Excel reports
- [ ] Mobile app version
- [ ] Advanced analytics (Sharpe ratio, beta, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your own portfolio tracking!

## Support

If you find this useful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs via GitHub Issues
- 💡 Suggesting features

---

**Disclaimer**: This app is for personal portfolio tracking only. Stock prices are sourced from Yahoo Finance and may be delayed. Always verify important financial information with your broker. This is not financial advice.
