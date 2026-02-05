// Stock price API utilities
window.StockAPI = {
  // Yahoo Finance API via CORS proxy
  async fetchStockPrice(ticker, isin) {
    try {
      // Add exchange suffix based on ISIN
      const yahooTicker = this.getYahooTicker(ticker, isin);
      
      // Use Yahoo Finance quote API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5d`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        console.warn(`No data for ${yahooTicker}`);
        return null;
      }
      
      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;
      
      // Get latest price (current or previous close)
      const closeArray = quotes.close.filter(p => p !== null);
      const currentPrice = closeArray[closeArray.length - 1];
      const priorClose = closeArray.length > 1 ? closeArray[closeArray.length - 2] : currentPrice;
      
      return {
        ticker: yahooTicker,
        currentPrice: currentPrice,
        priorClose: priorClose,
        change: currentPrice - priorClose,
        changePercent: ((currentPrice - priorClose) / priorClose) * 100,
        timestamp: new Date(timestamps[timestamps.length - 1] * 1000),
        currency: result.meta.currency
      };
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
      return null;
    }
  },
  
  async fetchHistoricalPrices(ticker, isin, startDate, endDate) {
    try {
      const yahooTicker = this.getYahooTicker(ticker, isin);
      
      const start = Math.floor(startDate.getTime() / 1000);
      const end = Math.floor(endDate.getTime() / 1000);
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&period1=${start}&period2=${end}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        return [];
      }
      
      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;
      
      // Build array of { date, close }
      const history = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] !== null) {
          history.push({
            date: new Date(timestamps[i] * 1000),
            close: quotes.close[i]
          });
        }
      }
      
      return history;
    } catch (error) {
      console.error(`Error fetching historical prices for ${ticker}:`, error);
      return [];
    }
  },
  
  async fetchMultipleStockPrices(holdings) {
    const promises = holdings.map(h => this.fetchStockPrice(h.ticker, h.isin));
    const results = await Promise.all(promises);
    
    // Map results back to holdings
    const priceMap = {};
    results.forEach((result, index) => {
      if (result) {
        priceMap[holdings[index].ticker] = result;
      }
    });
    
    return priceMap;
  },
  
  getYahooTicker(ticker, isin) {
    if (!isin || isin.length < 2) {
      return ticker;
    }
    
    const countryCode = isin.substring(0, 2);
    const suffix = window.EXCHANGE_SUFFIXES[countryCode] || '';
    
    return ticker + suffix;
  },
  
  // Cache prices in localStorage with 5-minute expiry
  getCachedPrice(ticker) {
    const cached = localStorage.getItem(`price_${ticker}`);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;
    
    // Cache expires after 5 minutes
    if (age > 5 * 60 * 1000) {
      localStorage.removeItem(`price_${ticker}`);
      return null;
    }
    
    return data.price;
  },
  
  setCachedPrice(ticker, price) {
    const data = {
      price: price,
      timestamp: Date.now()
    };
    localStorage.setItem(`price_${ticker}`, JSON.stringify(data));
  }
};
