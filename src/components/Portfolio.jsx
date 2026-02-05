const { useState, useEffect } = React;
const { Link } = window.ReactRouterDOM;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

window.Portfolio = function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState('1M');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load holdings from storage
    const storedHoldings = window.DataProcessor.loadFromStorage('holdings') || [];
    
    if (storedHoldings.length === 0) {
      setLoading(false);
      return;
    }
    
    setHoldings(storedHoldings);
    
    // Fetch current prices
    try {
      const priceData = await window.StockAPI.fetchMultipleStockPrices(storedHoldings);
      setPrices(priceData);
      
      // Calculate metrics
      const portfolioMetrics = window.DataProcessor.calculatePortfolioMetrics(storedHoldings, priceData);
      setMetrics(portfolioMetrics);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
    
    setLoading(false);
  };

  const formatCurrency = (value, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const sortHoldings = (holdingsToSort) => {
    return [...holdingsToSort].sort((a, b) => {
      const aPrice = prices[a.ticker];
      const bPrice = prices[b.ticker];
      
      if (!aPrice && !bPrice) return 0;
      if (!aPrice) return 1;
      if (!bPrice) return -1;
      
      const aMetrics = window.DataProcessor.calculateHoldingMetrics(a, aPrice);
      const bMetrics = window.DataProcessor.calculateHoldingMetrics(b, bPrice);
      
      let aValue, bValue;
      
      switch (sortBy) {
        case 'value':
          aValue = aMetrics.currentValue;
          bValue = bMetrics.currentValue;
          break;
        case 'profit':
          aValue = aMetrics.profit;
          bValue = bMetrics.profit;
          break;
        case 'profitPercent':
          aValue = aMetrics.profitPercent;
          bValue = bMetrics.profitPercent;
          break;
        case 'dayChange':
          aValue = aMetrics.dayChange;
          bValue = bMetrics.dayChange;
          break;
        case 'name':
          aValue = a.title;
          bValue = b.title;
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          aValue = aMetrics.currentValue;
          bValue = bMetrics.currentValue;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Import your trading data to start tracking your portfolio
          </p>
          <Link
            to="/import"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Data
          </Link>
        </div>
      </div>
    );
  }

  const sortedHoldings = sortHoldings(holdings);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Portfolio KPI */}
      {metrics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Portfolio Value</h2>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {formatCurrency(metrics.totalValue)}
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-600">
                  Invested: {formatCurrency(metrics.totalInvested)}
                </span>
                <span className={`font-semibold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.profit >= 0 ? '+' : ''}{formatCurrency(metrics.profit)} ({formatPercent(metrics.profitPercent)})
                </span>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Refresh Prices
            </button>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Holdings ({holdings.length})</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="value">Value</option>
              <option value="profit">Profit</option>
              <option value="profitPercent">Profit %</option>
              <option value="dayChange">Day Change</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className={`w-5 h-5 text-gray-600 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Invested</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Day Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedHoldings.map((holding) => {
                const price = prices[holding.ticker];
                const metrics = window.DataProcessor.calculateHoldingMetrics(holding, price);
                
                return (
                  <tr key={holding.ticker} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/holding/${holding.ticker}`} className="block">
                        <div className="font-medium text-gray-900">{holding.title}</div>
                        <div className="text-sm text-gray-500">{holding.ticker}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {holding.shares.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {price ? formatCurrency(metrics.currentPrice) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {price ? formatCurrency(metrics.currentValue) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(holding.totalInvested)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {price ? (
                        <div>
                          <div>{formatCurrency(metrics.profit)}</div>
                          <div className="text-xs">{formatPercent(metrics.profitPercent)}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${metrics.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {price ? (
                        <div>
                          <div>{formatCurrency(metrics.dayChange)}</div>
                          <div className="text-xs">{formatPercent(metrics.dayChangePercent)}</div>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
