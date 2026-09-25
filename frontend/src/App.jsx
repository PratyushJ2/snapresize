import { useState } from 'react';

export default function App() {
  const [imageUrl, setImageUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_full.jpg');
  const [width, setWidth] = useState(400);
  const [quality, setQuality] = useState(80);
  const [storageUrl, setStorageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const queryParams = new URLSearchParams({ url: imageUrl, width, quality });
    
    try {
      const response = await fetch(`http://localhost:8000/resize?token_bust=${Date.now()}&${queryParams.toString()}`);
      const data = await response.json();
      if (data.storage_url) {
        // Fix MinIO container hostname mapping for the host browser if needed
        let finalUrl = data.storage_url;
        // If running locally, ensure the browser can reach MinIO via localhost:9000 instead of internal container name `minio:9000`
        finalUrl = finalUrl.replace('http://minio:9000', 'http://localhost:9000');
        setStorageUrl(finalUrl);
      }
    } catch (err) {
      console.error("Failed to fetch resized image:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#f9fafb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>SnapResize Dashboard</h2>
      <p style={{ fontSize: '14px', color: '#4b5563' }}>Optimize, compress, and store images in cloud object storage.</p>
      
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginTop: '12px', fontWeight: '600', fontSize: '14px' }}>Image URL:</label>
        <input 
          type="url" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          required 
          style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '4px' }}
        />
        
        <label style={{ display: 'block', marginTop: '12px', fontWeight: '600', fontSize: '14px' }}>Target Width (px):</label>
        <input 
          type="number" 
          value={width} 
          onChange={(e) => setWidth(e.target.value)} 
          min="50" 
          max="2000" 
          style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '4px' }}
        />
        
        <label style={{ display: 'block', marginTop: '12px', fontWeight: '600', fontSize: '14px' }}>Quality (10-100):</label>
        <input 
          type="number" 
          value={quality} 
          onChange={(e) => setQuality(e.target.value)} 
          min="10" 
          max="100" 
          style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '4px' }}
        />
        
        <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px', background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
          {loading ? 'Processing & Storing...' : 'Resize & Store Image'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <h3>Result Preview (from S3/MinIO):</h3>
        {storageUrl && (
          <div>
            <img 
              src={storageUrl} 
              alt="Resized cloud preview" 
              style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid #e5e7eb', marginTop: '10px' }} 
            />
            <p style={{ fontSize: '12px', color: '#6b7280', wordBreak: 'break-all', marginTop: '8px' }}>
              Storage URL: <a href={storageUrl} target="_blank" rel="noreferrer">{storageUrl}</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}