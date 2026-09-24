import { useState } from 'react';

export default function App() {
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/1200/800');
  const [width, setWidth] = useState(400);
  const [quality, setQuality] = useState(80);
  const [submittedUrl, setSubmittedUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({ url: imageUrl, width, quality });
    // Point directly to the FastAPI backend running on port 8000
    setSubmittedUrl(`http://localhost:8000/resize?token_bust=${Date.now()}&${queryParams.toString()}`);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#f9fafb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2>SnapResize Dashboard</h2>
      <p style={{ fontSize: '14px', color: '#4b5563' }}>Optimize and compress images dynamically.</p>
      
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
        
        <button type="submit" style={{ width: '100%', marginTop: '20px', background: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>
          Resize Image
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <h3>Result Preview:</h3>
        {submittedUrl && (
          <img 
            src={submittedUrl} 
            alt="Resized preview" 
            style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid #e5e7eb', marginTop: '10px' }} 
          />
        )}
      </div>
    </div>
  );
}