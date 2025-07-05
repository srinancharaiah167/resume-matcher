import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';

export default function ResumeATS() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [response, setResponse] = useState([]);
  const [showDetails, setShowDetails] = useState({});

  const [jobFields, setJobFields] = useState({
    skills: '',
    experience: '',
    education: '',
    tools: '',
    description: ''
  });

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const handleChange = (e) => {
    setJobFields({ ...jobFields, [e.target.name]: e.target.value });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please upload at least one resume.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('resumes', file));
    Object.entries(jobFields).forEach(([key, value]) => formData.append(key, value));

    try {
      setUploadStatus('Analyzing resumes...');
      const result = await axios.post('http://localhost:5000/analyze_resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const sortedData = result.data.sort((a, b) => b.match_percentage - a.match_percentage);
      setResponse(sortedData);
      setUploadStatus('Analysis complete!');

      const visibility = {};
      sortedData.forEach((_, i) => {
        visibility[i] = false;
      });
      setShowDetails(visibility);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('Error during upload');
    }
  };

  const toggleDetails = (idx) => {
    setShowDetails(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const chartData = response.map(res => ({
    name: res.filename.length > 15 ? res.filename.slice(0, 15) + '...' : res.filename,
    match: res.match_percentage
  }));

  const sectionTitleStyle = {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#333',
    marginTop: '2rem',
    marginBottom: '1rem',
    borderBottom: '2px solid #ccc',
    paddingBottom: '0.5rem'
  };

  return (
    <div style={{ backgroundColor: '#eef6fa', minHeight: '100vh', padding: '3rem 1rem' }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1976d2' }}>
          🎯 Resume Screening Dashboard
        </h1>

        {/* Job Requirement Fields */}
        <div style={sectionTitleStyle}>📝 Job Requirements</div>
        {['skills', 'experience', 'education', 'tools', 'description'].map((field, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: '500', color: '#555' }}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              name={field}
              value={jobFields[field]}
              onChange={handleChange}
              placeholder={`Enter ${field}`}
              style={{
                width: '100%',
                padding: '10px 14px',
                marginTop: '0.3rem',
                borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '0.95rem'
              }}
            />
          </div>
        ))}

        {/* File Upload */}
        <div style={sectionTitleStyle}>📤 Upload Resumes</div>
        <input type="file" multiple accept="application/pdf" onChange={handleFileChange} />
        {selectedFiles.length > 0 && (
          <ul style={{ marginTop: '0.8rem', paddingLeft: '1.2rem' }}>
            {selectedFiles.map((file, idx) => (
              <li key={idx} style={{ color: '#444', fontSize: '0.9rem' }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleUpload}
          style={{
            marginTop: '1.5rem',
            padding: '12px 20px',
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          🔍 Upload & Analyze
        </button>

        {/* Upload Status */}
        {uploadStatus && (
          <p style={{ color: '#00796b', marginTop: '1rem', fontWeight: '500' }}>{uploadStatus}</p>
        )}

        {/* Results & Charts */}
        {response.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>📊 Match Percentage Chart</div>
            <div style={{ marginBottom: '2rem' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="match" fill="#42a5f5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={sectionTitleStyle}>📑 Resume Analysis Results</div>
            {response.map((res, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#222' }}>{res.filename}</span>
                  <span style={{ color: '#1976d2' }}>
                    Match Score: <strong>{res.match_percentage}%</strong>
                  </span>
                </div>

                <button
                  onClick={() => toggleDetails(idx)}
                  style={{
                    marginTop: '1rem',
                    backgroundColor: '#0288d1',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {showDetails[idx] ? 'Hide Details' : 'Show Details'}
                </button>

                {showDetails[idx] && (
                  <div style={{ marginTop: '1rem', lineHeight: '1.6', backgroundColor: '#fff', padding: '1rem', borderRadius: '5px' }}>
                    <p><strong>📄 Summary:</strong> {res.summary}</p>
                    <p><strong>❌ Missing Skills:</strong></p>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      {(Array.isArray(res.missing_skills) ? res.missing_skills : []).map((skill, i) => (
                        <li key={i}>🔹 {skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
