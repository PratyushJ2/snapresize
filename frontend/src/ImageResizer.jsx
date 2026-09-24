import React, { useState } from 'react';

export default function ImageResizer() {
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [resizedImageUrl, setResizedImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResize = async (e) => {
    e.preventDefault();
    if (!imageUrlInput) return;

    setLoading(true);
    setError(null);
    setResizedImageUrl(null);

    try {
      const response = await fetch('http://localhost:8000/resize-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageUrlInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch or process the image URL.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setResizedImageUrl(objectUrl);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>SnapResize URL Uploader</h2>
      
      <form onSubmit={handleResize}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="url" 
            placeholder="Paste image URL here..." 
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={!imageUrlInput || loading}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Resizing...' : 'Resize from URL'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

      {resizedImageUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Resized Result:</h3>
          <img 
            src={resizedImageUrl} 
            alt="Resized output" 
            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }} 
          />
        </div>
      )}
    </div>
  );
}