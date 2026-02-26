// src/components/AIChat.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';

function AIChat({ onTasksChanged }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Chat state
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m your AI task assistant. I can help you create, complete, and manage your tasks. Just ask me naturally!'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Voice state
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // Document state
    const [uploading, setUploading] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Text-to-Speech function (defined early so it can be used in handleVoiceInput)
    const speakText = useCallback((text) => {
        if (!synthesisRef.current) return;

        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthesisRef.current.speak(utterance);
    }, []);

    // Handle voice input function (defined with useCallback)
    const handleVoiceInput = useCallback(async (text) => {
        const userMessage = {
            role: 'user',
            content: text
        };
        
        setMessages(prev => {
            const newMessages = [...prev, userMessage];
            setLoading(true);

            // Call API
            aiAPI.chat({
                message: text,
                conversation_history: prev.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            }).then(response => {
                const aiMessage = response.data.data.message;
                const actions = response.data.data.actions_taken || [];

                const assistantMessage = {
                    role: 'assistant',
                    content: aiMessage
                };
                
                setMessages(prevMsgs => [...prevMsgs, assistantMessage]);
                speakText(aiMessage);

                if (actions.length > 0 && onTasksChanged) {
                    onTasksChanged();
                }
            }).catch(err => {
                console.error('AI error:', err);
            }).finally(() => {
                setLoading(false);
            });

            return newMessages;
        });
    }, [onTasksChanged, speakText]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPiece;
                } else {
                    interimTranscript += transcriptPiece;
                }
            }

            setTranscript(finalTranscript || interimTranscript);

            if (finalTranscript) {
                handleVoiceInput(finalTranscript);
            }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [handleVoiceInput]);

    // Handle chat send
    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages = [...messages, {
            role: 'user',
            content: userMessage
        }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const response = await aiAPI.chat({
                message: userMessage,
                conversation_history: messages
            });

            const aiMessage = response.data.data.message;
            const actions = response.data.data.actions_taken || [];

            setMessages([...newMessages, {
                role: 'assistant',
                content: aiMessage
            }]);

            if (actions.length > 0 && onTasksChanged) {
                onTasksChanged();
            }

        } catch (error) {
            console.error('AI chat error:', error);
            setMessages([...newMessages, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Toggle listening
    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsOpen(true);
            recognitionRef.current.start();
        }
    };

    // Stop speaking
    const stopSpeaking = () => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Document upload
    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('document', file);

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

            const successMessage = `✅ Analyzed document and created ${data.data.count} task${data.data.count !== 1 ? 's' : ''}!`;
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: successMessage
            }]);

            setShowDocumentUpload(false);

            if (onTasksChanged) {
                onTasksChanged();
            }

        } catch (err) {
            console.error('Upload error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Failed to analyze document: ${err.message}`
            }]);
        } finally {
            setUploading(false);
        }
    }, [onTasksChanged]);

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
        maxSize: 10485760,
        multiple: false,
        disabled: uploading
    });

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <div 
                    onClick={() => setIsOpen(true)}
                    style={styles.floatingButton}
                >
                    <span style={styles.floatingIcon}>💬</span>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    {/* Header */}
                    <div style={styles.header}>
                        <h3 style={styles.title}>🤖 AI Task Assistant</h3>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={styles.closeButton}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesContainer}>
                        {/* Voice status */}
                        {isListening && (
                            <div style={styles.voiceStatus}>
                                🔴 Listening... {transcript && `"${transcript}"`}
                            </div>
                        )}
                        {isSpeaking && (
                            <div style={styles.voiceStatus}>
                                🔊 Speaking... 
                                <button onClick={stopSpeaking} style={styles.stopSpeakButton}>
                                    Stop
                                </button>
                            </div>
                        )}

                        {/* Document upload area */}
                        {showDocumentUpload && (
                            <div style={styles.uploadArea}>
                                <div {...getRootProps()} style={{
                                    ...styles.dropzone,
                                    ...(isDragActive ? styles.dropzoneActive : {})
                                }}>
                                    <input {...getInputProps()} />
                                    {uploading ? (
                                        <p>📤 Analyzing...</p>
                                    ) : (
                                        <p>📄 Drop document or click to browse</p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setShowDocumentUpload(false)}
                                    style={styles.cancelUploadButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Chat messages */}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '10px'
                                }}
                            >
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '10px 15px',
                                    borderRadius: '12px',
                                    backgroundColor: msg.role === 'user' ? '#007bff' : '#f0f0f0',
                                    color: msg.role === 'user' ? 'white' : '#333',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {/* Safe rendering: handle both strings and objects */}
                                    {typeof msg.content === 'string' 
                                        ? msg.content 
                                        : JSON.stringify(msg.content, null, 2)
                                    }
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '10px 15px',
                                    borderRadius: '12px',
                                    backgroundColor: '#f0f0f0',
                                    color: '#666'
                                }}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={styles.inputContainer}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            disabled={loading}
                            style={styles.input}
                        />
                        
                        {/* Voice Button */}
                        <button
                            onClick={toggleListening}
                            disabled={loading}
                            style={{
                                ...styles.iconButton,
                                backgroundColor: isListening ? '#dc3545' : '#28a745'
                            }}
                            title="Voice input"
                        >
                            {isListening ? '🔴' : '🎤'}
                        </button>

                        {/* Document Button */}
                        <button
                            onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                            disabled={loading || uploading}
                            style={{
                                ...styles.iconButton,
                                backgroundColor: showDocumentUpload ? '#ffc107' : '#6c757d'
                            }}
                            title="Upload document"
                        >
                            📄
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{
                                ...styles.sendButton,
                                opacity: (loading || !input.trim()) ? 0.5 : 1
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

const styles = {
    floatingButton: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
        transition: 'all 0.3s ease',
        zIndex: 1000
    },
    floatingIcon: {
        fontSize: '28px'
    },
    chatWindow: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '400px',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
    },
    header: {
        padding: '15px 20px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '600'
    },
    closeButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '0',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
    },
    voiceStatus: {
        backgroundColor: '#fff3cd',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '10px',
        fontSize: '13px',
        color: '#856404',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    stopSpeakButton: {
        padding: '4px 8px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '11px'
    },
    uploadArea: {
        marginBottom: '15px'
    },
    dropzone: {
        border: '2px dashed #007bff',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f8f9fa',
        marginBottom: '10px',
        fontSize: '13px'
    },
    dropzoneActive: {
        borderColor: '#28a745',
        backgroundColor: '#e8f5e9'
    },
    cancelUploadButton: {
        width: '100%',
        padding: '8px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px'
    },
    inputContainer: {
        padding: '15px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '8px',
        backgroundColor: '#f8f9fa'
    },
    input: {
        flex: 1,
        padding: '10px 12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none'
    },
    iconButton: {
        padding: '10px 12px',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        minWidth: '40px',
        transition: 'opacity 0.2s'
    },
    sendButton: {
        padding: '10px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px'
    }
};

// Add hover effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }
`;
document.head.appendChild(styleSheet);

export default AIChat;