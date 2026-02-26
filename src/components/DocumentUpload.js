// src/components/DocumentUpload.js

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function DocumentUpload({ onTasksCreated }) {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploading(true);
        setError('');
        setResult(null);

        try {
            // Get auth token
            const token = localStorage.getItem('auth_token');

            // Create FormData
            const formData = new FormData();
            formData.append('document', file);

            // Upload to Laravel
            const response = await fetch('http://127.0.0.1:8000/api/documents/analyze', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            // Show results
            setResult(data.data);

            // Notify parent to refresh tasks
            if (onTasksCreated) {
                onTasksCreated();
            }

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to analyze document');
        } finally {
            setUploading(false);
        }
    }, [onTasksCreated]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxSize: 10485760, // 10MB
        multiple: false
    });

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>📄 Document Analyzer</h3>
            <p style={styles.subtitle}>Upload a document and AI will extract tasks automatically!</p>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                style={{
                    ...styles.dropzone,
                    ...(isDragActive ? styles.dropzoneActive : {}),
                    ...(uploading ? styles.dropzoneDisabled : {})
                }}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <div style={styles.uploadingState}>
                        <div style={styles.spinner}></div>
                        <p>Analyzing document...</p>
                    </div>
                ) : isDragActive ? (
                    <p style={styles.dropText}>📂 Drop the file here...</p>
                ) : (
                    <div style={styles.dropContent}>
                        <p style={styles.dropText}>🎯 Drag & drop a document here</p>
                        <p style={styles.dropHint}>or click to browse</p>
                        <p style={styles.acceptedFiles}>
                            Accepted: PDF, Word, Text, Images (max 10MB)
                        </p>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div style={styles.error}>
                    ❌ {error}
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div style={styles.results}>
                    <div style={styles.resultHeader}>
                        <h4 style={styles.resultTitle}>✅ Analysis Complete!</h4>
                        <span style={styles.taskCount}>
                            {result.count} task{result.count !== 1 ? 's' : ''} created
                        </span>
                    </div>

                    {/* Summary */}
                    {result.summary && (
                        <div style={styles.summary}>
                            <strong>Summary:</strong> {result.summary}
                        </div>
                    )}

                    {/* Extracted Text Preview */}
                    {result.extracted_text && (
                        <details style={styles.details}>
                            <summary style={styles.detailsSummary}>
                                📝 View extracted text
                            </summary>
                            <div style={styles.extractedText}>
                                {result.extracted_text}
                            </div>
                        </details>
                    )}

                    {/* Created Tasks */}
                    <div style={styles.tasksList}>
                        <strong>Tasks Created:</strong>
                        {result.tasks_created.map((task, index) => (
                            <div key={task.id} style={styles.taskItem}>
                                <div style={styles.taskNumber}>{index + 1}</div>
                                <div style={styles.taskDetails}>
                                    <div style={styles.taskTitle}>{task.title}</div>
                                    {task.description && (
                                        <div style={styles.taskDescription}>{task.description}</div>
                                    )}
                                    <div style={styles.taskMeta}>
                                        {task.priority && (
                                            <span style={{
                                                ...styles.priorityBadge,
                                                ...(task.priority === 'high' ? styles.priorityHigh :
                                                    task.priority === 'low' ? styles.priorityLow :
                                                    styles.priorityMedium)
                                            }}>
                                                {task.priority}
                                            </span>
                                        )}
                                        {task.deadline && (
                                            <span style={styles.deadline}>
                                                📅 {task.deadline}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setResult(null)}
                        style={styles.closeButton}
                    >
                        Upload Another Document
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
    },
    title: {
        margin: '0 0 5px 0',
        color: '#333'
    },
    subtitle: {
        margin: '0 0 20px 0',
        color: '#666',
        fontSize: '14px'
    },
    dropzone: {
        border: '2px dashed #007bff',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundColor: '#f8f9fa'
    },
    dropzoneActive: {
        borderColor: '#28a745',
        backgroundColor: '#e8f5e9'
    },
    dropzoneDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed'
    },
    dropContent: {
        color: '#666'
    },
    dropText: {
        fontSize: '18px',
        fontWeight: '500',
        margin: '0 0 10px 0',
        color: '#333'
    },
    dropHint: {
        fontSize: '14px',
        color: '#999',
        margin: '5px 0'
    },
    acceptedFiles: {
        fontSize: '12px',
        color: '#999',
        marginTop: '10px'
    },
    uploadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
    },
    spinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite'
    },
    error: {
        backgroundColor: '#fee',
        color: '#c33',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '15px',
        fontSize: '14px'
    },
    results: {
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
    },
    resultHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '15px',
        borderBottom: '2px solid #dee2e6'
    },
    resultTitle: {
        margin: 0,
        color: '#28a745'
    },
    taskCount: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '5px 15px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500'
    },
    summary: {
        backgroundColor: '#e7f3ff',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '14px',
        lineHeight: '1.6'
    },
    details: {
        marginBottom: '15px'
    },
    detailsSummary: {
        cursor: 'pointer',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500'
    },
    extractedText: {
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '6px',
        marginTop: '10px',
        fontSize: '13px',
        color: '#666',
        maxHeight: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
    },
    tasksList: {
        marginTop: '15px'
    },
    taskItem: {
        display: 'flex',
        gap: '15px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '6px',
        marginTop: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    taskNumber: {
        width: '30px',
        height: '30px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        flexShrink: 0
    },
    taskDetails: {
        flex: 1
    },
    taskTitle: {
        fontWeight: '500',
        marginBottom: '5px',
        color: '#333'
    },
    taskDescription: {
        fontSize: '13px',
        color: '#666',
        marginBottom: '8px'
    },
    taskMeta: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
    },
    priorityBadge: {
        fontSize: '11px',
        padding: '3px 10px',
        borderRadius: '12px',
        fontWeight: '500',
        textTransform: 'uppercase'
    },
    priorityHigh: {
        backgroundColor: '#fee',
        color: '#c33'
    },
    priorityMedium: {
        backgroundColor: '#fff3cd',
        color: '#856404'
    },
    priorityLow: {
        backgroundColor: '#e7f3ff',
        color: '#004085'
    },
    deadline: {
        fontSize: '12px',
        color: '#666'
    },
    closeButton: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        width: '100%'
    }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default DocumentUpload;