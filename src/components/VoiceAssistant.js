// src/components/VoiceAssistant.js

import React, { useState, useEffect, useRef } from 'react';
import { aiAPI } from '../services/api';

function VoiceAssistant({ onTasksChanged }) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [conversation, setConversation] = useState([]);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError('');
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

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access.');
            } else {
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Handle voice input and send to AI
    const handleVoiceInput = async (text) => {
        setIsProcessing(true);
        
        // Add user message to conversation
        const userMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString()
        };
        setConversation(prev => [...prev, userMessage]);

        try {
            // Send to AI
            const response = await aiAPI.chat({
                message: text,
                conversation_history: conversation.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            });

            const aiMessage = response.data.data.message;
            const actions = response.data.data.actions_taken || [];

            // Add AI response to conversation
            const assistantMessage = {
                role: 'assistant',
                content: aiMessage,
                timestamp: new Date().toLocaleTimeString()
            };
            setConversation(prev => [...prev, assistantMessage]);

            setAiResponse(aiMessage);

            // Speak the response
            speakText(aiMessage);

            // Refresh tasks if AI took actions
            if (actions.length > 0 && onTasksChanged) {
                onTasksChanged();
            }

        } catch (err) {
            console.error('AI error:', err);
            const errorMsg = 'Sorry, I encountered an error processing your request.';
            setError(errorMsg);
            speakText(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    // Text-to-Speech
    const speakText = (text) => {
        if (!synthesisRef.current) return;

        // Cancel any ongoing speech
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
        };

        synthesisRef.current.speak(utterance);
    };

    // Start/Stop listening
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
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

    // Clear conversation
    const clearConversation = () => {
        setConversation([]);
        setTranscript('');
        setAiResponse('');
        setError('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>🎤 Voice Assistant</h3>
                <button onClick={clearConversation} style={styles.clearButton}>
                    Clear
                </button>
            </div>

            {error && (
                <div style={styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {/* Microphone Button */}
            <div style={styles.micSection}>
                <button
                    onClick={toggleListening}
                    disabled={isProcessing || isSpeaking}
                    style={{
                        ...styles.micButton,
                        ...(isListening ? styles.micButtonActive : {}),
                        ...(isProcessing ? styles.micButtonDisabled : {})
                    }}
                >
                    {isListening ? (
                        <span style={styles.micIcon}>🔴</span>
                    ) : (
                        <span style={styles.micIcon}>🎤</span>
                    )}
                </button>

                <div style={styles.status}>
                    {isListening && <span style={styles.listeningText}>Listening...</span>}
                    {isProcessing && <span style={styles.processingText}>Processing...</span>}
                    {isSpeaking && (
                        <div style={styles.speakingContainer}>
                            <span style={styles.speakingText}>Speaking...</span>
                            <button onClick={stopSpeaking} style={styles.stopButton}>
                                Stop
                            </button>
                        </div>
                    )}
                    {!isListening && !isProcessing && !isSpeaking && (
                        <span style={styles.idleText}>Tap microphone to speak</span>
                    )}
                </div>
            </div>

            {/* Live Transcript */}
            {transcript && (
                <div style={styles.transcript}>
                    <strong>You said:</strong> "{transcript}"
                </div>
            )}

            {/* Conversation History */}
            {conversation.length > 0 && (
                <div style={styles.conversation}>
                    <h4 style={styles.conversationTitle}>Conversation</h4>
                    <div style={styles.messageList}>
                        {conversation.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    ...styles.message,
                                    ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
                                }}
                            >
                                <div style={styles.messageHeader}>
                                    <span style={styles.messageRole}>
                                        {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                                    </span>
                                    <span style={styles.messageTime}>{msg.timestamp}</span>
                                </div>
                                <div style={styles.messageContent}>{msg.content}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Commands Help */}
            <details style={styles.help}>
                <summary style={styles.helpSummary}>💡 Try saying...</summary>
                <ul style={styles.helpList}>
                    <li>"Create a task to buy groceries"</li>
                    <li>"What tasks do I have?"</li>
                    <li>"Mark task 5 as complete"</li>
                    <li>"Delete the shopping task"</li>
                    <li>"What should I focus on today?"</li>
                </ul>
            </details>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '500px',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #eee'
    },
    title: {
        margin: 0,
        color: '#333'
    },
    clearButton: {
        padding: '6px 12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    error: {
        backgroundColor: '#fee',
        color: '#c33',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '13px'
    },
    micSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '30px 0',
        gap: '20px'
    },
    micButton: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: '4px solid #007bff',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    micButtonActive: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        animation: 'pulse 1.5s infinite'
    },
    micButtonDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
    },
    micIcon: {
        fontSize: '48px'
    },
    status: {
        textAlign: 'center'
    },
    listeningText: {
        color: '#dc3545',
        fontWeight: 'bold',
        fontSize: '16px'
    },
    processingText: {
        color: '#ffc107',
        fontWeight: 'bold',
        fontSize: '16px'
    },
    speakingContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    speakingText: {
        color: '#28a745',
        fontWeight: 'bold',
        fontSize: '16px'
    },
    stopButton: {
        padding: '4px 12px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    idleText: {
        color: '#999',
        fontSize: '14px'
    },
    transcript: {
        backgroundColor: '#e7f3ff',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '14px'
    },
    conversation: {
        flex: 1,
        overflowY: 'auto',
        marginBottom: '15px'
    },
    conversationTitle: {
        margin: '0 0 10px 0',
        fontSize: '14px',
        color: '#666'
    },
    messageList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    message: {
        padding: '12px',
        borderRadius: '8px',
        fontSize: '13px'
    },
    userMessage: {
        backgroundColor: '#007bff',
        color: 'white',
        marginLeft: '20%'
    },
    assistantMessage: {
        backgroundColor: '#f0f0f0',
        color: '#333',
        marginRight: '20%'
    },
    messageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px',
        fontSize: '11px',
        opacity: 0.8
    },
    messageRole: {
        fontWeight: 'bold'
    },
    messageTime: {
        fontSize: '10px'
    },
    messageContent: {
        lineHeight: '1.5'
    },
    help: {
        marginTop: 'auto',
        fontSize: '13px',
        color: '#666'
    },
    helpSummary: {
        cursor: 'pointer',
        fontWeight: '500',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
    },
    helpList: {
        margin: '10px 0',
        paddingLeft: '20px',
        lineHeight: '2'
    }
};

// Add CSS animation for pulse effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes pulse {
        0% {
            transform: scale(1);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        50% {
            transform: scale(1.05);
            box-shadow: 0 8px 16px rgba(220, 53, 69, 0.3);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    }
`;
document.head.appendChild(styleSheet);

export default VoiceAssistant;