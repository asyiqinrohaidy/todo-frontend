// src/components/MultiAgent.js

import React, { useState } from 'react';

function MultiAgent({ onTasksCreated }) {
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!goal.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch('http://127.0.0.1:8000/api/multi-agent/process', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    goal: goal,
                    context: context || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process goal');
            }

            setResult(data.data);
            setGoal('');
            setContext('');

            // Refresh tasks
            if (onTasksCreated) {
                onTasksCreated();
            }

        } catch (err) {
            console.error('Multi-agent error:', err);
            setError(err.message || 'Failed to process your goal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>AI Multi-Agent System</h3>
            <p style={styles.subtitle}>
                Multiple AI agents collaborate to break down your goal into actionable tasks
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Your Goal:</label>
                    <input
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., Launch a mobile app in 3 months"
                        disabled={loading}
                        style={styles.input}
                    />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Additional Context (optional):</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Any additional details, constraints, or preferences..."
                        disabled={loading}
                        rows={3}
                        style={styles.textarea}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading || !goal.trim()}
                    style={{
                        ...styles.submitButton,
                        opacity: (loading || !goal.trim()) ? 0.6 : 1
                    }}
                >
                    {loading ? 'Agents Working...' : 'Process with Multi-Agent System'}
                </button>
            </form>

            {error && (
                <div style={styles.error}>
                    ❌ {error}
                </div>
            )}

            {result && (
                <div style={styles.results}>
                    <h4 style={styles.resultsTitle}>✅ Multi-Agent Analysis Complete!</h4>

                    {/* Agent Conversation */}
                    <div style={styles.conversation}>
                        <h5 style={styles.sectionTitle}>Agent Collaboration:</h5>
                        {result.agent_conversation.map((agent, index) => (
                            <div key={index} style={styles.agentCard}>
                                <div style={styles.agentHeader}>
                                    <span style={styles.agentEmoji}>{agent.emoji}</span>
                                    <div>
                                        <div style={styles.agentName}>{agent.agent}</div>
                                        <div style={styles.agentRole}>{agent.role}</div>
                                    </div>
                                </div>
                                <div style={styles.agentSummary}>{agent.summary}</div>
                            </div>
                        ))}
                    </div>

                    {/* Executive Summary */}
                    <div style={styles.summary}>
                        <h5 style={styles.sectionTitle}>📋 Executive Summary:</h5>
                        <p>{result.final_plan.executive_summary}</p>
                    </div>

                    {/* Tasks Created */}
                    <div style={styles.tasksCreated}>
                        <h5 style={styles.sectionTitle}>
                            ✨ {result.tasks_created.length} Tasks Created:
                        </h5>
                        {result.tasks_created.map((task, index) => (
                            <div key={task.id} style={styles.taskItem}>
                                <span style={styles.taskNumber}>{index + 1}</span>
                                <div style={styles.taskInfo}>
                                    <div style={styles.taskTitle}>{task.title}</div>
                                    <div style={styles.taskMeta}>
                                        <span style={{
                                            ...styles.priorityBadge,
                                            ...(task.priority === 'high' ? styles.priorityHigh :
                                                task.priority === 'low' ? styles.priorityLow :
                                                styles.priorityMedium)
                                        }}>
                                            {task.priority}
                                        </span>
                                        <span style={styles.phase}>{task.phase}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Next Steps */}
                    {result.final_plan.next_steps && (
                        <div style={styles.nextSteps}>
                            <h5 style={styles.sectionTitle}>🎯 Next Steps:</h5>
                            <ul style={styles.stepsList}>
                                {result.final_plan.next_steps.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Key Insights */}
                    {result.final_plan.key_insights && (
                        <div style={styles.insights}>
                            <h5 style={styles.sectionTitle}>💡 Key Insights:</h5>
                            <ul style={styles.insightsList}>
                                {result.final_plan.key_insights.map((insight, index) => (
                                    <li key={index}>{insight}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={() => setResult(null)}
                        style={styles.closeButton}
                    >
                        Process Another Goal
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
    form: {
        marginBottom: '20px'
    },
    inputGroup: {
        marginBottom: '15px'
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '500',
        fontSize: '14px',
        color: '#333'
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        boxSizing: 'border-box'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        resize: 'vertical'
    },
    submitButton: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
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
    resultsTitle: {
        margin: '0 0 20px 0',
        color: '#28a745',
        fontSize: '18px'
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#495057'
    },
    conversation: {
        marginBottom: '20px'
    },
    agentCard: {
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '10px',
        border: '1px solid #e9ecef'
    },
    agentHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
    },
    agentEmoji: {
        fontSize: '24px'
    },
    agentName: {
        fontWeight: '600',
        fontSize: '14px',
        color: '#212529'
    },
    agentRole: {
        fontSize: '12px',
        color: '#6c757d'
    },
    agentSummary: {
        fontSize: '13px',
        color: '#495057',
        lineHeight: '1.5'
    },
    summary: {
        backgroundColor: '#e7f3ff',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px',
        lineHeight: '1.6'
    },
    tasksCreated: {
        marginBottom: '20px'
    },
    taskItem: {
        display: 'flex',
        gap: '12px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '8px',
        alignItems: 'start'
    },
    taskNumber: {
        width: '24px',
        height: '24px',
        backgroundColor: '#007bff',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        flexShrink: 0
    },
    taskInfo: {
        flex: 1
    },
    taskTitle: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#212529',
        marginBottom: '6px'
    },
    taskMeta: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    priorityBadge: {
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '10px',
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
    phase: {
        fontSize: '12px',
        color: '#6c757d'
    },
    nextSteps: {
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px'
    },
    stepsList: {
        margin: '8px 0 0 20px',
        padding: 0,
        fontSize: '14px',
        lineHeight: '1.8'
    },
    insights: {
        backgroundColor: '#d4edda',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px'
    },
    insightsList: {
        margin: '8px 0 0 20px',
        padding: 0,
        fontSize: '14px',
        lineHeight: '1.8'
    },
    closeButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        marginTop: '10px'
    }
};

export default MultiAgent;