// Corporate actions processing
window.CorporateActions = {
  // Apply stock conversions (e.g., CS -> UBS)
  applyConversions(trades) {
    const conversions = window.CORPORATE_ACTIONS.conversions;
    const additionalTrades = [];
    
    Object.keys(conversions).forEach(oldTicker => {
      const config = conversions[oldTicker];
      const conversionDate = new Date(config.date);
      
      // Find all trades before conversion date
      const relevantTrades = trades.filter(t => 
        t.ticker === oldTicker && 
        t.type === 'TRADE' &&
        new Date(t.timestamp) < conversionDate
      );
      
      if (relevantTrades.length === 0) return;
      
      // Calculate shares held at conversion
      let sharesHeld = 0;
      relevantTrades.forEach(t => {
        sharesHeld += t.buySell === 'BUY' ? t.quantity : -t.quantity;
      });
      
      if (sharesHeld <= 0) return;
      
      // Create SELL transaction for old stock
      additionalTrades.push({
        ticker: oldTicker,
        title: `${config.oldTitle} (Conversion)`,
        type: 'TRADE',
        timestamp: config.date,
        quantity: sharesHeld,
        buySell: 'SELL',
        pricePerShare: 0,
        totalAmount: 0,
        currency: 'GBP',
        venue: 'CONVERSION',
        orderId: `CONV_${oldTicker}_${config.newSymbol}_SELL`
      });
      
      // Create BUY transaction for new stock
      const newShares = sharesHeld * config.ratio;
      additionalTrades.push({
        ticker: config.newSymbol,
        title: `${config.newTitle} (Conversion)`,
        type: 'TRADE',
        timestamp: new Date(new Date(config.date).getTime() + 1000).toISOString(),
        quantity: newShares,
        buySell: 'BUY',
        pricePerShare: 0,
        totalAmount: 0,
        currency: 'GBP',
        venue: 'CONVERSION',
        orderId: `CONV_${oldTicker}_${config.newSymbol}_BUY`
      });
    });
    
    return [...trades, ...additionalTrades].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  },
  
  // Calculate current shares with splits applied
  applyStockSplits(ticker, shares) {
    const splits = window.CORPORATE_ACTIONS.splits;
    const splitRatio = splits[ticker] || 1;
    return shares * splitRatio;
  },
  
  // Check if stock is auto-exited
  isAutoExited(ticker) {
    return window.CORPORATE_ACTIONS.autoExits.hasOwnProperty(ticker);
  },
  
  getAutoExitInfo(ticker) {
    return window.CORPORATE_ACTIONS.autoExits[ticker];
  },
  
  // Get split-adjusted average price
  getSplitAdjustedAvgPrice(ticker, avgPrice) {
    const splits = window.CORPORATE_ACTIONS.splits;
    const splitRatio = splits[ticker] || 1;
    return avgPrice / splitRatio;
  }
};
