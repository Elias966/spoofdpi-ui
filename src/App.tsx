import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Terminal as TerminalIcon, 
  Shield, 
  Globe, 
  Cpu, 
  Activity,
  Github,
  Info
} from 'lucide-react';

declare global {
  interface Window {
    electron: {
      startProxy: (args: any) => void;
      stopProxy: () => void;
      onProxyLog: (callback: (log: string) => void) => void;
      onProxyStatus: (callback: (status: any) => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'logs'>('dashboard');
  
  // Settings - Optimized for v0.12.0 Stable
  const [port, setPort] = useState('8080');
  const [dnsAddr, setDnsAddr] = useState('8.8.8.8');
  const [dnsMode, setDnsMode] = useState('udp');
  const [httpsSplitMode, setHttpsSplitMode] = useState('default');

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.electron) {
      window.electron.onProxyLog((log) => {
        setLogs((prev) => [...prev.slice(-200), log]);
      });

      window.electron.onProxyStatus((status) => {
        setIsRunning(status.status === 'running');
      });
    }
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const toggleProxy = () => {
    if (isRunning) {
      window.electron.stopProxy();
    } else {
      window.electron.startProxy({
        port,
        dnsAddr,
        dnsMode,
        httpsSplitMode,
      });
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo-container">
          <Shield className="logo-icon" />
          <span className="logo-text">SpoofDPI</span>
        </div>
        
        <div className="nav-items">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Activity size={20} />
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            <TerminalIcon size={20} />
            <span>Logs</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <a href="https://github.com/xvzc/SpoofDPI" target="_blank" rel="noopener noreferrer">
            <Github size={18} />
            <span>v0.12.0 Stable</span>
          </a>
        </div>
      </nav>

      <main className="content">
        <header className="content-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="status-indicator">
            <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
            <span>{isRunning ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            <div className="hero-card">
              <div className="hero-content">
                <h2>Bypass Censorship</h2>
                <p>Proxy is listening on 127.0.0.1:{port}</p>
                <button className={`connect-btn ${isRunning ? 'running' : ''}`} onClick={toggleProxy}>
                  {isRunning ? <Square fill="currentColor" /> : <Play fill="currentColor" />}
                  <span>{isRunning ? 'Stop Proxy' : 'Start Proxy'}</span>
                </button>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-card guide">
                <Info size={24} className="info-icon" />
                <h3>Setup Firefox</h3>
                <ol>
                  <li>Settings → Network Settings</li>
                  <li>Select "Manual proxy configuration"</li>
                  <li>HTTP Proxy: <strong>127.0.0.1</strong></li>
                  <li>Port: <strong>{port}</strong></li>
                  <li>Check "Also use this proxy for HTTPS"</li>
                </ol>
              </div>
              <div className="info-card">
                <Globe size={24} className="info-icon" />
                <h3>DNS Provider</h3>
                <p>{dnsMode === 'doh' ? 'DNS over HTTPS Enabled' : `UDP: ${dnsAddr}`}</p>
              </div>
              <div className="info-card">
                <Shield size={24} className="info-icon" />
                <h3>Security</h3>
                <p>Stable v0.12.0 Backend</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view">
            <div className="settings-group">
              <h3>Network</h3>
              <div className="setting-item">
                <label>Listen Port</label>
                <input type="text" value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div className="setting-item">
                <label>DNS Server</label>
                <input type="text" value={dnsAddr} onChange={(e) => setDnsAddr(e.target.value)} />
              </div>
              <div className="setting-item toggle">
                <div className="setting-text">
                  <label>Enable DoH</label>
                  <p>Use DNS-over-HTTPS (Google)</p>
                </div>
                <input type="checkbox" checked={dnsMode === 'doh'} onChange={(e) => setDnsMode(e.target.checked ? 'doh' : 'udp')} />
              </div>
            </div>
            
            <div className="settings-group">
              <h3>Aggression</h3>
              <div className="setting-item">
                <label>Packet Fragmentation</label>
                <select value={httpsSplitMode} onChange={(e) => setHttpsSplitMode(e.target.value)}>
                  <option value="default">Default (Smart)</option>
                  <option value="chunk">Aggressive (1-byte chunks)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="logs-view">
            <div className="terminal">
              {logs.length === 0 ? <div className="no-logs">Ready. Click Start to begin.</div> : logs.map((log, i) => (
                <div key={i} className="log-line">
                  <span className="log-content">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
