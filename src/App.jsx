const { BrowserRouter, Routes, Route, HashRouter } = window.ReactRouterDOM;

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <window.Navigation />
        <Routes>
          <Route path="/" element={<window.Portfolio />} />
          <Route path="/import" element={<window.ImportData />} />
          <Route path="/holding/:ticker" element={<window.HoldingDetail />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
