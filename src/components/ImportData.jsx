const { useState } = React;
const { useNavigate } = window.ReactRouterDOM;

window.ImportData = function ImportData() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState('');
  const [detectedBroker, setDetectedBroker] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('');
      setError('');
      setDetectedBroker(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setImporting(true);
    setStatus('Parsing file...');
    setError('');

    try {
      // Parse file
      let rawData;
      if (file.name.endsWith('.csv')) {
        rawData = await window.DataProcessor.parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        rawData = await window.DataProcessor.parseExcel(file);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or Excel file.');
      }

      if (!rawData || rawData.length === 0) {
        throw new Error('No data found in file');
      }

      setStatus('Detecting broker...');

      // Detect broker
      const headers = Object.keys(rawData[0]);
      const brokerKey = window.DataProcessor.detectBroker(headers);

      if (!brokerKey) {
        throw new Error('Could not detect broker. Supported brokers: FreeTrade, Groww');
      }

      const broker = window.BROKER_MAPPINGS[brokerKey];
      setDetectedBroker(broker.name);
      setStatus(`Detected ${broker.name} format. Processing data...`);

      // Transform data
      const transformedData = window.DataProcessor.transformData(rawData, brokerKey);

      // Load existing data
      const existingData = window.DataProcessor.loadFromStorage('allData') || [];

      // Merge data (avoiding duplicates by orderId)
      const existingOrderIds = new Set(
        existingData
          .filter(d => d.orderId)
          .map(d => d.orderId)
      );

      const newData = transformedData.filter(d => {
        if (!d.orderId) return true; // Keep records without orderId
        return !existingOrderIds.has(d.orderId);
      });

      const mergedData = [...existingData, ...newData].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setStatus('Calculating holdings...');

      // Calculate holdings
      const holdings = window.DataProcessor.calculateHoldings(mergedData);

      // Save to storage
      window.DataProcessor.saveToStorage('allData', mergedData);
      window.DataProcessor.saveToStorage('holdings', holdings);

      setStatus(`Successfully imported ${newData.length} new records. Found ${holdings.length} current holdings.`);

      // Navigate to portfolio after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.message);
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSample = () => {
    // For demo purposes - you can remove this
    setStatus('Sample data loaded. Click "Import Data" to process.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Trading Data</h1>
        <p className="text-gray-600 mb-6">
          Upload your CSV or Excel files from FreeTrade or Groww to track your portfolio
        </p>

        {/* File upload area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {file ? file.name : 'Click to upload or drag and drop'}
            </span>
            <span className="text-xs text-gray-500 mt-1">CSV or Excel files</span>
          </label>
        </div>

        {/* Detected broker */}
        {detectedBroker && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              ✓ Detected broker: <strong>{detectedBroker}</strong>
            </p>
          </div>
        )}

        {/* Status message */}
        {status && !error && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{status}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              !file || importing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {importing ? 'Importing...' : 'Import Data'}
          </button>
        </div>

        {/* Info section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Supported Formats</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-20 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">FreeTrade</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">FreeTrade Activity Feed</p>
                <p className="text-xs text-gray-500">Export from FreeTrade app: Profile → History → Export</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-20 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">Groww</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">Groww Order History</p>
                <p className="text-xs text-gray-500">Download from Groww: Stocks → Orders → Export</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data management */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Management</h3>
          <p className="text-xs text-gray-600 mb-3">
            Your data is stored locally in your browser. Export to JSON to back up to GitHub.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (confirm('This will clear all imported data. Are you sure?')) {
                  localStorage.clear();
                  setStatus('All data cleared');
                  setFile(null);
                  setDetectedBroker(null);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
            >
              Clear All Data
            </button>
            <label className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 cursor-pointer">
              Import from JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    window.DataProcessor.importFromJSON(data);
                    setStatus('Data imported from JSON');
                    setTimeout(() => navigate('/'), 1500);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
