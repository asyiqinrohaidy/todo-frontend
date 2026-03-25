// src/components/AIChat.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { useDropzone } from 'react-dropzone';

function AIChat({ onTasksChanged }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m your AI task assistant. I can help you create, complete, and manage your tasks. Just ask me naturally!'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    const [uploading, setUploading] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ FIXED: Added safety check
    const cleanTextForSpeech = (text) => {
        if (!text || typeof text !== 'string') return '';
        return text.replace(/[🎯✨🤖✅❌📊⏳🔥🟢🟡🔴📅⏱️🕐]/g, '');
    };

    // ✅ FIXED: Added safety check
    const speakText = useCallback((text) => {
        if (!text || typeof text !== 'string') return;
        if (!synthesisRef.current) return;
        
        synthesisRef.current.cancel();
        const cleanText = cleanTextForSpeech(text);
        
        if (!cleanText) return;
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthesisRef.current.speak(utterance);
    }, []);

    // ✅ FIXED: Added better error handling
    const handleVoiceInput = useCallback(async (text) => {
        if (!text || typeof text !== 'string') return;
        
        const userMessage = { role: 'user', content: text };
        
        setMessages(prev => {
            const newMessages = [...prev, userMessage];
            setLoading(true);

            aiAPI.chat({
                message: text,
                conversation_history: prev.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            }).then(response => {
                console.log('🤖 Voice AI Response:', response);
                
                // ✅ FIXED: Safe extraction with fallbacks
                const aiMessage = response?.data?.data?.message || 
                                 response?.data?.data?.response || 
                                 response?.data?.message || 
                                 'I received your message.';
                
                const actions = response?.data?.data?.actions_taken || [];
                
                setMessages(prevMsgs => [...prevMsgs, { role: 'assistant', content: aiMessage }]);
                speakText(aiMessage);
                
                if (actions.length > 0 && onTasksChanged) onTasksChanged();
            }).catch(err => {
                console.error('❌ Voice AI error:', err);
                console.error('❌ Error details:', err.response?.data);
                
                const errorMsg = 'Sorry, I encountered an error. Please try again.';
                setMessages(prevMsgs => [...prevMsgs, { role: 'assistant', content: errorMsg }]);
                speakText(errorMsg);
            }).finally(() => {
                setLoading(false);
            });

            return newMessages;
        });
    }, [onTasksChanged, speakText]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => { setIsListening(true); setTranscript(''); };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const piece = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalTranscript += piece;
                else interimTranscript += piece;
            }
            setTranscript(finalTranscript || interimTranscript);
            if (finalTranscript) handleVoiceInput(finalTranscript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;

        return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
    }, [handleVoiceInput]);

    // ✅ FIXED: Complete rewrite with better error handling
    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            console.log('📤 Sending chat message:', userMessage);
            
            const response = await aiAPI.chat({ 
                message: userMessage, 
                conversation_history: messages 
            });
            
            console.log('📥 Received chat response:', response);

            // ✅ FIXED: Safe extraction with multiple fallbacks
            const aiMessage = response?.data?.data?.message || 
                             response?.data?.data?.response || 
                             response?.data?.message || 
                             response?.data?.response ||
                             'I received your message but had trouble forming a response.';

            if (!aiMessage || typeof aiMessage !== 'string') {
                throw new Error('Invalid AI response format');
            }

            const actions = response?.data?.data?.actions_taken || [];
            
            setMessages([...newMessages, { role: 'assistant', content: aiMessage }]);
            speakText(aiMessage);
            
            if (actions.length > 0 && onTasksChanged) onTasksChanged();
            
        } catch (error) {
            console.error('❌ AI chat error:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            
            const errorMsg = error.response?.data?.message || 
                            'Sorry, I encountered an error. Please try again.';
            
            setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
            speakText(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return;
        }
        if (isListening) recognitionRef.current.stop();
        else { setIsOpen(true); recognitionRef.current.start(); }
    };

    const stopSpeaking = () => {
        if (synthesisRef.current) { 
            synthesisRef.current.cancel(); 
            setIsSpeaking(false); 
        }
    };

    const handleOpenChat = () => {
        setIsOpen(true);
        if (messages.length > 0 && messages[0].role === 'assistant') {
            setTimeout(() => speakText(messages[0].content), 300);
        }
    };

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
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Upload failed');

            const successMessage = `Analyzed document and created ${data.data.count} task${data.data.count !== 1 ? 's' : ''}!`;
            setMessages(prev => [...prev, { role: 'assistant', content: successMessage }]);
            speakText(successMessage);
            setShowDocumentUpload(false);
            if (onTasksChanged) onTasksChanged();
        } catch (err) {
            console.error('❌ Upload error:', err);
            const errorMsg = `Failed to analyze document: ${err.message}`;
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
            speakText(errorMsg);
        } finally {
            setUploading(false);
        }
    }, [onTasksChanged, speakText]);

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
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <div
                    onClick={handleOpenChat}
                    style={styles.floatingButton}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
                >
                    <div style={styles.floatingGradient}></div>
                    <span style={styles.floatingIcon}>🤖</span>
                    {isListening && <div style={styles.pulseRing}></div>}
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={styles.chatWindow}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.aiAvatar}>🤖</div>
                            <div>
                                <h3 style={styles.title}>Fulkrum AI</h3>
                                <p style={styles.subtitle}>
                                    {isSpeaking ? '🔊 Speaking...' : 'Always here to help'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { stopSpeaking(); setIsOpen(false); }}
                            style={styles.closeButton}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesContainer}>
                        {isListening && (
                            <div style={styles.listeningBanner}>
                                <div style={styles.listeningDot}></div>
                                <span>Listening... {transcript && `"${transcript}"`}</span>
                            </div>
                        )}

                        {isSpeaking && (
                            <div style={styles.speakingBanner}>
                                <span>🔊 Speaking...</span>
                                <button onClick={stopSpeaking} style={styles.stopButton}>Stop</button>
                            </div>
                        )}

                        {showDocumentUpload && (
                            <div style={styles.uploadSection}>
                                <div {...getRootProps()} style={{
                                    ...styles.dropzone,
                                    ...(isDragActive ? styles.dropzoneActive : {}),
                                    ...(uploading ? styles.dropzoneUploading : {})
                                }}>
                                    <input {...getInputProps()} />
                                    <div style={styles.dropzoneIcon}>{uploading ? '⏳' : '📄'}</div>
                                    <p style={styles.dropzoneText}>
                                        {uploading ? 'Analyzing document...' : isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}
                                    </p>
                                    <p style={styles.dropzoneHint}>PDF, Word, Text, or Images</p>
                                </div>
                                <button onClick={() => setShowDocumentUpload(false)} style={styles.cancelButton}>
                                    Cancel
                                </button>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    marginBottom: '16px',
                                    animation: 'slideIn 0.3s ease-out'
                                }}
                            >
                                {msg.role === 'assistant' && (
                                    <div style={styles.assistantAvatar}>🤖</div>
                                )}
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                                        : '#f3f4f6',
                                    color: msg.role === 'user' ? 'white' : '#111827',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    boxShadow: msg.role === 'user'
                                        ? '0 2px 8px rgba(234, 113, 35, 0.3)'
                                        : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                    fontSize: '14px',
                                    lineHeight: '1.5'
                                }}>
                                    {typeof msg.content === 'string'
                                        ? msg.content
                                        : JSON.stringify(msg.content, null, 2)
                                    }
                                </div>
                                {msg.role === 'user' && (
                                    <div style={styles.userAvatar}>👤</div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                                <div style={styles.assistantAvatar}>🤖</div>
                                <div style={styles.typingIndicator}>
                                    <span style={styles.typingDot}></span>
                                    <span style={styles.typingDot}></span>
                                    <span style={styles.typingDot}></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={styles.inputArea}>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                disabled={loading}
                                style={styles.input}
                            />

                            <div style={styles.actionButtons}>
                                {/* Voice Button */}
                                <button
                                    onClick={toggleListening}
                                    disabled={loading}
                                    style={{
                                        ...styles.actionBtn,
                                        background: isListening
                                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    }}
                                    title="Voice input"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {isListening ? '⏹️' : '🎤'}
                                </button>

                                {/* Document Button */}
                                <button
                                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                                    disabled={loading || uploading}
                                    style={{
                                        ...styles.actionBtn,
                                        background: showDocumentUpload
                                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                    }}
                                    title="Upload document"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    📎
                                </button>

                                {/* Send Button */}
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    style={{
                                        ...styles.sendBtn,
                                        opacity: (loading || !input.trim()) ? 0.5 : 1,
                                        cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    ✨ Send
                                </button>
                            </div>
                        </div>
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
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(234, 113, 35, 0.45), 0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
        overflow: 'hidden'
    },
    floatingGradient: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '50%'
    },
    floatingIcon: {
        fontSize: '32px',
        zIndex: 1,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
    },
    pulseRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '3px solid #ef4444',
        animation: 'pulse 1.5s ease-out infinite'
    },
    chatWindow: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '420px',
        height: '650px',
        maxHeight: 'calc(100vh - 60px)',
        borderRadius: '20px',
        backgroundColor: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden'
    },
    header: {
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '20px 20px 0 0'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    aiAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        border: '2px solid rgba(255, 255, 255, 0.3)'
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: '700',
        color: 'white'
    },
    subtitle: {
        margin: '2px 0 0 0',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.85)'
    },
    closeButton: {
        width: '32px',
        height: '32px',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        fontWeight: '300'
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column'
    },
    listeningBanner: {
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: '#991b1b',
        fontWeight: '500',
        border: '1px solid #fecaca'
    },
    listeningDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        animation: 'blink 1s ease-in-out infinite'
    },
    speakingBanner: {
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#9a3412',
        fontWeight: '500',
        border: '1px solid #fed7aa'
    },
    stopButton: {
        padding: '4px 12px',
        background: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: '600',
        transition: 'opacity 0.2s'
    },
    uploadSection: {
        marginBottom: '20px'
    },
    dropzone: {
        border: '2px dashed #d1d5db',
        borderRadius: '16px',
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: 'white',
        marginBottom: '12px',
        transition: 'all 0.3s ease'
    },
    dropzoneActive: {
        borderColor: '#f97316',
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        transform: 'scale(1.02)'
    },
    dropzoneUploading: {
        borderColor: '#f97316',
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        cursor: 'wait'
    },
    dropzoneIcon: {
        fontSize: '48px',
        marginBottom: '12px'
    },
    dropzoneText: {
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
    },
    dropzoneHint: {
        margin: 0,
        fontSize: '12px',
        color: '#9ca3af'
    },
    cancelButton: {
        width: '100%',
        padding: '10px',
        background: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'opacity 0.2s'
    },
    assistantAvatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        marginRight: '8px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(234, 113, 35, 0.3)'
    },
    userAvatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        marginLeft: '8px',
        flexShrink: 0
    },
    typingIndicator: {
        padding: '12px 16px',
        borderRadius: '16px 16px 16px 4px',
        background: '#f3f4f6',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    typingDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#9ca3af',
        animation: 'bounce 1.4s infinite ease-in-out both'
    },
    inputArea: {
        padding: '20px 24px',
        background: 'white',
        borderTop: '1px solid #e5e7eb'
    },
    inputWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit',
        boxSizing: 'border-box'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        padding: '10px 14px',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'transform 0.2s',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontWeight: '500'
    },
    sendBtn: {
        flex: 1,
        padding: '12px 20px',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'transform 0.2s, opacity 0.2s',
        boxShadow: '0 4px 12px rgba(234, 113, 35, 0.4)'
    }
};

// CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }

    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }

    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

    input:focus {
        border-color: #f97316 !important;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12) !important;
    }
`;
document.head.appendChild(styleSheet);

export default AIChat;