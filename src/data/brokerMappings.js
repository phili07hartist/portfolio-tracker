// Broker-specific column mappings
window.BROKER_MAPPINGS = {
  FREETRADE: {
    name: 'FreeTrade',
    detect: (headers) => headers.includes('Title') && headers.includes('ISIN') && headers.includes('Order ID'),
    mapping: {
      title: 'Title',
      ticker: 'Ticker',
      isin: 'ISIN',
      type: 'Type',
      timestamp: 'Timestamp',
      quantity: 'Quantity',
      buySell: 'Buy / Sell',
      pricePerShare: 'Price per Share in Account Currency',
      totalAmount: 'Total Amount',
      currency: 'Account Currency',
      venue: 'Venue',
      orderId: 'Order ID',
      dividendAmount: 'Dividend Net Distribution Amount',
      dividendExDate: 'Dividend Ex Date',
      dividendPayDate: 'Dividend Pay Date'
    },
    typeMapping: {
      'ORDER': 'TRADE',
      'DIVIDEND': 'DIVIDEND',
      'INTEREST_FROM_CASH': 'INTEREST',
      'INTEREST': 'INTEREST',
      'TOP_UP': 'TOP_UP',
      'WITHDRAWAL': 'WITHDRAWAL',
      'CAPITAL': 'CAPITAL',
      'SHARE_LENDING_INCOME': 'INCOME',
      'SPECIAL_DIVIDEND': 'DIVIDEND'
    }
  },
  
  GROWW: {
    name: 'Groww',
    detect: (headers) => headers.includes('Stock name') && headers.includes('Symbol') && headers.includes('Exchange'),
    mapping: {
      title: 'Stock name',
      ticker: 'Symbol',
      isin: 'ISIN',
      type: 'Type',
      timestamp: 'Execution date and time',
      quantity: 'Quantity',
      buySell: 'Type', // BUY/SELL is in Type column
      pricePerShare: null, // Calculate from Value/Quantity
      totalAmount: 'Value',
      currency: 'INR', // Default to INR
      venue: 'Exchange',
      orderId: 'Exchange Order Id'
    },
    typeMapping: {
      'BUY': 'TRADE',
      'SELL': 'TRADE'
    },
    transform: (row) => {
      // Calculate price per share
      if (row.Quantity && row.Value) {
        row.calculatedPrice = parseFloat(row.Value) / parseFloat(row.Quantity);
      }
      // Set buy/sell from Type
      row.calculatedBuySell = row.Type;
      return row;
    }
  }
};

// Corporate actions configuration
window.CORPORATE_ACTIONS = {
  // Stock conversions (e.g., Credit Suisse to UBS)
  conversions: {
    'CS': {
      newSymbol: 'UBS',
      oldTitle: 'Credit Suisse',
      newTitle: 'UBS',
      ratio: 2.05520721 / 46.2010582,
      date: '2023-06-12T00:00:01Z'
    },
    'CBX': {
      newSymbol: 'CLAI',
      oldTitle: 'Cellular Goods',
      newTitle: 'Cel AI',
      ratio: 1,
      date: '2024-02-13T00:00:01Z'
    }
  },
  
  // Stock splits (ratio = new shares / old shares)
  splits: {
    'AMZN': 4.874117783,
    'REVB': 0.005208333,
    'NVDA': 10,
    'NFLX': 10,
    'LITM': 0.076923077,
    'WBX': 0.05,
    'GSK': 0.788732394
  },
  
  // Auto-exited stocks (delisted/acquired) with final payout in GBP
  autoExits: {
    'YMAB': { amount: 115.78, reason: 'Acquired - $8.6 per share' },
    'BLUE': { amount: 32.07, reason: 'Acquired - $3 per share' },
    'CLAI': { amount: 0, reason: 'Delisted' },
    'HEIT': { amount: 428.73, reason: 'Acquired - £0.924 per share' },
    'LTG': { amount: 183, reason: 'Acquired - £1 per share' }
  }
};

// Exchange suffix mapping for Yahoo Finance
window.EXCHANGE_SUFFIXES = {
  'GB': '.L',   // UK -> London
  'IE': '.L',   // Ireland -> London
  'US': '',     // USA -> No suffix
  'CA': '.TO',  // Canada -> Toronto
  'DE': '.DE',  // Germany
  'FR': '.PA',  // France
  'CH': '.SW',  // Switzerland
  'AU': '.AX',  // Australia
  'HK': '.HK',  // Hong Kong
  'JP': '.T',   // Japan
  'IT': '.MI',  // Italy
  'ES': '.MC',  // Spain
  'NL': '.AS',  // Netherlands
  'BE': '.BR',  // Belgium
  'SE': '.ST',  // Sweden
  'NO': '.OL',  // Norway
  'DK': '.CO',  // Denmark
  'IN': '.NS',  // India -> NSE
  'BR': '.SA',  // Brazil
  'MX': '.MX',  // Mexico
  'ZA': '.JO'   // South Africa
};
