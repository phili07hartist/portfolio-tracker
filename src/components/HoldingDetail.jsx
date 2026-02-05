const { useState, useEffect } = React;
const { useParams, Link } = window.ReactRouterDOM;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts;

window.HoldingDetail = function HoldingDetail() {
  const { ticker } = useParams();
  const [holding, setHolding] = useState(null);
  const [price, setPrice] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1M');

  useEffect(() => {
    loadData();
  }, [ticker]);

  const loadData = async () => {
    setLoading(true);

    // Load holdings
    const holdings = window.DataProcessor.loadFromStorage('holdings') || [];
    const foundHolding = holdings.find(h => h.ticker === ticker);

    if (!foundHolding) {
      setLoading(false);
      return;
    }

    setHolding(foundHolding);

    // Fetch current price
    const priceData = await window.StockAPI.fetchStockPrice(foundHolding.ticker, foundHolding.isin);
    setPrice(priceData);

    if (priceData) {
      const holdingMetrics = window.DataProcessor.calculateHoldingMetrics(foundHolding, priceData);
      setMetrics(holdingMetrics);
    }

    // Load activities
    const allData = window.DataProcessor.loadFromStorage('allData') || [];
    const tickerActivities = allData.filter(d => 
      d.ticker === ticker && 
      (d.type === 'TRADE' || d.type === 'DIVIDEND')
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setActivities(tickerActivities);

    // Fetch historical prices
    await loadHistoricalData(foundHolding, timeRange);

    setLoading(false);
  };

  const loadHistoricalData = async (holdingData, range) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '1D': startDate.setDate(now.getDate() - 1); break;
      case '1W': startDate.setDate(now.getDate() - 7); break;
      case '1M': startDate.setMonth(now.getMonth() - 1); break;
      case '3M': startDate.setMonth(now.getMonth() - 3); break;
      case '6M': startDate.setMonth(now.getMonth() - 6); break;
      case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
      case 'ALL':
        // Find earliest trade date
        const firstTrade = holdingData.trades[holdingData.trades.length - 1];
        startDate = new Date(firstTrade.timestamp);
        break;
    }

    const history = await window.StockAPI.fetchHistoricalPrices(
      holdingData.ticker,
      holdingData.isin,
      startDate,
      now
    );

    setHistoricalData(history);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Holding Not Found</h2>
        <Link to="/" className="text-blue-600 hover:text-blue-700">
          Back to Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back to Portfolio
        </Link>
      </div>

      {/* Header KPI */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{holding.title}</h1>
            <p className="text-sm text-gray-500">{holding.ticker}</p>
          </div>
          {price && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics.currentPrice)}
              </div>
              <div className={`text-sm font-medium ${price.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {price.change >= 0 ? '+' : ''}{formatCurrency(price.change)} ({formatPercent(price.changePercent)})
              </div>
            </div>
          )}
        </div>

        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">Shares</div>
              <div className="text-lg font-semibold text-gray-900">{holding.shares.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Avg Price</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(holding.avgPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Current Value</div>
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(metrics.currentValue)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Profit/Loss</div>
              <div className={`text-lg font-semibold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.profit)}
                <span className="text-sm ml-1">({formatPercent(metrics.profitPercent)})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Price History</h2>
          <div className="flex space-x-1">
            {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  loadHistoricalData(holding, range);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {historicalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `£${value.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Price']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-GB')}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No historical data available
          </div>
        )}
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Activity ({activities.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(activity.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.type === 'TRADE'
                        ? activity.buySell === 'BUY'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.type === 'TRADE' ? activity.buySell : activity.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {activity.quantity ? activity.quantity.toFixed(4) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {activity.pricePerShare ? formatCurrency(activity.pricePerShare) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(activity.totalAmount || activity.dividendAmount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
