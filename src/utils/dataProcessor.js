// Data processing utilities
window.DataProcessor = {
  // Detect broker from CSV headers
  detectBroker(headers) {
    for (let brokerKey in window.BROKER_MAPPINGS) {
      const broker = window.BROKER_MAPPINGS[brokerKey];
      if (broker.detect(headers)) {
        return brokerKey;
      }
    }
    return null;
  },
  
  // Parse CSV file
  async parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  },
  
  // Parse Excel file
  async parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },
  
  // Transform raw data to standardized format
  transformData(rawData, brokerKey) {
    const broker = window.BROKER_MAPPINGS[brokerKey];
    const mapping = broker.mapping;
    
    return rawData.map(row => {
      // Apply broker-specific transformation if exists
      if (broker.transform) {
        row = broker.transform(row);
      }
      
      // Map to standard format
      const standardRow = {
        title: row[mapping.title] || '',
        ticker: row[mapping.ticker] || '',
        isin: row[mapping.isin] || '',
        type: this.mapType(row[mapping.type], broker.typeMapping),
        timestamp: this.parseTimestamp(row[mapping.timestamp]),
        quantity: parseFloat(row[mapping.quantity]) || 0,
        buySell: row.calculatedBuySell || row[mapping.buySell] || '',
        pricePerShare: parseFloat(row.calculatedPrice || row[mapping.pricePerShare]) || 0,
        totalAmount: parseFloat(row[mapping.totalAmount]) || 0,
        currency: row[mapping.currency] || mapping.currency || 'GBP',
        venue: row[mapping.venue] || '',
        orderId: row[mapping.orderId] || '',
        dividendAmount: parseFloat(row[mapping.dividendAmount]) || 0,
        rawData: row
      };
      
      return standardRow;
    }).filter(row => {
      // Filter out empty rows and monthly statements
      return row.ticker || row.type !== 'TRADE';
    });
  },
  
  mapType(rawType, typeMapping) {
    return typeMapping[rawType] || rawType;
  },
  
  parseTimestamp(timestamp) {
    if (!timestamp) return new Date().toISOString();
    
    // Handle different date formats
    // ISO format: 2026-01-28T17:39:00.000Z
    // Groww format: 26-03-2024 09:00 AM
    
    if (timestamp.includes('T')) {
      return new Date(timestamp).toISOString();
    }
    
    // Parse Groww format: DD-MM-YYYY HH:MM AM/PM
    const parts = timestamp.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)/);
    if (parts) {
      const [, day, month, year, hour, minute, period] = parts;
      let hour24 = parseInt(hour);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      return new Date(`${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:00`).toISOString();
    }
    
    return new Date(timestamp).toISOString();
  },
  
  // Calculate holdings from trade data
  calculateHoldings(allData) {
    const trades = allData.filter(d => d.type === 'TRADE' && d.ticker);
    
    // Apply corporate actions (conversions)
    const tradesWithConversions = window.CorporateActions.applyConversions(trades);
    
    // Group by ticker
    const holdingsMap = {};
    
    tradesWithConversions.forEach(trade => {
      if (!holdingsMap[trade.ticker]) {
        holdingsMap[trade.ticker] = {
          ticker: trade.ticker,
          title: trade.title,
          isin: trade.isin,
          shares: 0,
          totalInvested: 0,
          trades: []
        };
      }
      
      const holding = holdingsMap[trade.ticker];
      const multiplier = trade.buySell === 'BUY' ? 1 : -1;
      
      holding.shares += trade.quantity * multiplier;
      holding.totalInvested += trade.totalAmount * multiplier;
      holding.trades.push(trade);
    });
    
    // Apply stock splits and filter
    const holdings = Object.values(holdingsMap)
      .map(h => {
        const adjustedShares = window.CorporateActions.applyStockSplits(h.ticker, h.shares);
        const avgPrice = h.shares !== 0 ? h.totalInvested / h.shares : 0;
        const adjustedAvgPrice = window.CorporateActions.getSplitAdjustedAvgPrice(h.ticker, avgPrice);
        
        return {
          ...h,
          shares: adjustedShares,
          avgPrice: adjustedAvgPrice
        };
      })
      .filter(h => {
        // Remove auto-exited stocks
        if (window.CorporateActions.isAutoExited(h.ticker)) return false;
        // Remove zero positions
        if (Math.abs(h.shares) < 0.0001) return false;
        // Remove UK T-Bills
        if (h.title.includes('UK T-Bill')) return false;
        return true;
      });
    
    return holdings;
  },
  
  // Calculate other activity (dividends, interest, etc.)
  calculateOtherActivity(allData) {
    return allData.filter(d => 
      ['DIVIDEND', 'INTEREST', 'TOP_UP', 'WITHDRAWAL', 'INCOME', 'CAPITAL'].includes(d.type)
    );
  },
  
  // Calculate portfolio metrics
  calculatePortfolioMetrics(holdings, prices) {
    let totalValue = 0;
    let totalInvested = 0;
    
    holdings.forEach(h => {
      const price = prices[h.ticker];
      if (price) {
        totalValue += h.shares * price.currentPrice;
      }
      totalInvested += h.totalInvested;
    });
    
    const profit = totalValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    
    return {
      totalValue,
      totalInvested,
      profit,
      profitPercent
    };
  },
  
  // Calculate holding metrics
  calculateHoldingMetrics(holding, price) {
    if (!price) {
      return {
        currentValue: 0,
        profit: 0,
        profitPercent: 0,
        dayChange: 0,
        dayChangePercent: 0
      };
    }
    
    const currentValue = holding.shares * price.currentPrice;
    const profit = currentValue - holding.totalInvested;
    const profitPercent = holding.totalInvested > 0 ? (profit / holding.totalInvested) * 100 : 0;
    const dayChange = holding.shares * (price.currentPrice - price.priorClose);
    const dayChangePercent = price.priorClose > 0 ? ((price.currentPrice - price.priorClose) / price.priorClose) * 100 : 0;
    
    return {
      currentValue,
      profit,
      profitPercent,
      dayChange,
      dayChangePercent,
      currentPrice: price.currentPrice,
      priorClose: price.priorClose
    };
  },
  
  // Save data to localStorage
  saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },
  
  // Load data from localStorage
  loadFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  
  // Export data as JSON for GitHub
  exportToJSON() {
    const allData = this.loadFromStorage('allData') || [];
    const holdings = this.loadFromStorage('holdings') || [];
    
    return {
      lastUpdated: new Date().toISOString(),
      allData,
      holdings
    };
  },
  
  // Import data from JSON
  importFromJSON(jsonData) {
    if (jsonData.allData) {
      this.saveToStorage('allData', jsonData.allData);
    }
    if (jsonData.holdings) {
      this.saveToStorage('holdings', jsonData.holdings);
    }
  }
};
