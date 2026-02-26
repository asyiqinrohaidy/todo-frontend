// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { authAPI, tasksAPI, aiAPI } from '../services/api';
import AIChat from '../components/AIChat';
import MultiAgent from '../components/MultiAgent';

function Dashboard() {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New task form fields
    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskEstimatedHours, setTaskEstimatedHours] = useState('');

    // AI analysis state
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

    // Fetch user and tasks when component loads
    useEffect(() => {
        fetchUserAndTasks();
    }, []);

    const fetchUserAndTasks = async () => {
        try {
            const [userResponse, tasksResponse] = await Promise.all([
                authAPI.getUser(),
                tasksAPI.getAll()
            ]);

            setUser(userResponse.data.data);
            setTasks(tasksResponse.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data');
            setLoading(false);
        }
    };

    // Callback for AI to refresh tasks when it makes changes
    const refreshTasks = async () => {
        try {
            const response = await tasksAPI.getAll();
            setTasks(response.data.data);
        } catch (error) {
            console.error('Error refreshing tasks:', error);
        }
    };

    const analyzeTaskWithAI = async () => {
        console.log('analyzeTaskWithAI called');
        console.log('Task title:', newTask);
        console.log('Due date:', taskDueDate);
        
        if (!newTask.trim() || !taskDueDate) {
            console.log('Missing task title or due date, aborting');
            return;
        }

        console.log('Starting AI analysis...');
        setAiAnalyzing(true);
        setAiSuggestion(null);

        try {
            console.log('Calling API...');
            const response = await aiAPI.analyzeTask({
                title: newTask,
                due_date: taskDueDate
            });

            console.log('API response:', response.data);

            const { priority, estimated_hours, reasoning } = response.data.data;

            // Auto-populate fields
            setTaskPriority(priority);
            setTaskEstimatedHours(estimated_hours.toString());
            setAiSuggestion(reasoning);

            console.log('Fields updated:', { priority, estimated_hours, reasoning });

        } catch (error) {
            console.error('AI analysis error:', error);
            setAiSuggestion('AI analysis unavailable - please set manually');
        } finally {
            setAiAnalyzing(false);
        }
    };

    // Auto-analyze when due date OR task title changes
    useEffect(() => {
        console.log('useEffect triggered');
        console.log('Due date:', taskDueDate);
        console.log('Task title:', newTask);
        
        if (taskDueDate && newTask.trim()) {
            console.log('Conditions met, calling analyzeTaskWithAI');
            analyzeTaskWithAI();
        } else {
            console.log('Conditions not met');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskDueDate, newTask]);  // ← ADD newTask HERE

    const handleLogout = async () => {
        try {
            await authAPI.logout();
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        
        if (!newTask.trim()) return;

        try {
            const taskData = {
                title: newTask,
                priority: taskPriority
            };

            if (taskDueDate) {
                taskData.due_date = taskDueDate;
            }

            if (taskEstimatedHours) {
                taskData.estimated_hours = parseInt(taskEstimatedHours);
            }

            const response = await tasksAPI.create(taskData);
            setTasks([response.data.data, ...tasks]);
            
            // Reset form
            setNewTask('');
            setTaskPriority('medium');
            setTaskDueDate('');
            setTaskEstimatedHours('');
            setAiSuggestion(null);
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task');
        }
    };

    const handleToggleComplete = async (task) => {
        try {
            const response = await tasksAPI.update(task.id, {
                is_completed: !task.is_completed
            });
            
            setTasks(tasks.map(t => 
                t.id === task.id ? response.data.data : t
            ));
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await tasksAPI.delete(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Failed to delete task');
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading...</div>;
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.welcomeText}>Welcome, {user?.name}!</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>
                    Logout
                </button>
            </div>

            {error && (
                <div style={styles.error}>{error}</div>
            )}

            <MultiAgent onTasksCreated={refreshTasks} />

            {/* Enhanced Create Task Form */}
            <div style={styles.createCard}>
                <h3 style={styles.cardTitle}>Create New Task</h3>
                <form onSubmit={handleCreateTask}>
                    <div style={styles.formGrid}>
                        {/* Task Title */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Task Title *</label>
                            <input
                                type="text"
                                placeholder="What do you need to do?"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>

                        {/* Due Date */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Due Date</label>
                            <input
                                type="datetime-local"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        {/* Priority (AI-powered) */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Priority {aiAnalyzing && '🤖'}
                            </label>
                            <select
                                value={taskPriority}
                                onChange={(e) => setTaskPriority(e.target.value)}
                                style={{
                                    ...styles.input,
                                    backgroundColor: aiSuggestion ? '#e7f3ff' : 'white'
                                }}
                                disabled={aiAnalyzing}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Estimated Hours (AI-powered) */}
                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Estimated Hours {aiAnalyzing && '🤖'}
                            </label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                placeholder="e.g., 2"
                                value={taskEstimatedHours}
                                onChange={(e) => setTaskEstimatedHours(e.target.value)}
                                style={{
                                    ...styles.input,
                                    backgroundColor: aiSuggestion ? '#e7f3ff' : 'white'
                                }}
                                disabled={aiAnalyzing}
                            />
                        </div>
                    </div>

                    {/* AI Suggestion Display */}
                    {aiSuggestion && (
                        <div style={styles.aiSuggestion}>
                            AI Analysis: {aiSuggestion}
                        </div>
                    )}

                    <button type="submit" style={styles.createButton} disabled={aiAnalyzing}>
                        {aiAnalyzing ? 'Analyzing...' : 'Add Task'}
                    </button>
                </form>
            </div>
            
            {/* Task List - Full Width */}
            <div style={styles.taskSection}>
                <h3 style={styles.taskHeader}>
                    Your Tasks ({tasks.length})
                </h3>
                
                {tasks.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>No tasks yet. Create one above!</p>
                    </div>
                ) : (
                    <div style={styles.taskList}>
                        {tasks.map(task => (
                            <div 
                                key={task.id}
                                style={{
                                    ...styles.taskCard,
                                    backgroundColor: task.is_completed ? '#d4edda' : 'white',
                                    borderLeft: `4px solid ${
                                        task.priority === 'high' ? '#dc3545' :
                                        task.priority === 'medium' ? '#ffc107' :
                                        '#28a745'
                                    }`
                                }}
                            >
                                <div style={styles.taskContent}>
                                    {/* Priority Badge */}
                                    {task.priority && (
                                        <span style={{
                                            ...styles.priorityBadge,
                                            backgroundColor: 
                                                task.priority === 'high' ? '#fee' :
                                                task.priority === 'medium' ? '#fff3cd' :
                                                '#e7f3ff',
                                            color:
                                                task.priority === 'high' ? '#c33' :
                                                task.priority === 'medium' ? '#856404' :
                                                '#004085'
                                        }}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                    )}

                                    <h4 style={{
                                        ...styles.taskTitle,
                                        textDecoration: task.is_completed ? 'line-through' : 'none',
                                        color: task.is_completed ? '#666' : '#333'
                                    }}>
                                        {task.title}
                                    </h4>
                                    
                                    {task.description && (
                                        <p style={styles.taskDescription}>
                                            {task.description}
                                        </p>
                                    )}

                                    {/* Task Metadata */}
                                    <div style={styles.taskMetadata}>
                                        {/* Due Date */}
                                        {task.due_date && (
                                            <span style={{
                                                ...styles.metaBadge,
                                                backgroundColor: new Date(task.due_date) < new Date() && !task.is_completed ? '#fee' : '#f8f9fa',
                                                color: new Date(task.due_date) < new Date() && !task.is_completed ? '#c33' : '#666'
                                            }}>
                                                Due: {new Date(task.due_date).toLocaleDateString()}
                                                {new Date(task.due_date) < new Date() && !task.is_completed && ' (Overdue!)'}
                                            </span>
                                        )}

                                        {/* Estimated Hours */}
                                        {task.estimated_hours && (
                                            <span style={styles.metaBadge}>
                                                {task.estimated_hours}h
                                            </span>
                                        )}

                                        {/* Created Date */}
                                        <span style={styles.metaBadge}>
                                            Created: {new Date(task.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={styles.taskActions}>
                                    <button
                                        onClick={() => handleToggleComplete(task)}
                                        style={{
                                            ...styles.actionButton,
                                            backgroundColor: task.is_completed ? '#ffc107' : '#28a745'
                                        }}
                                    >
                                        {task.is_completed ? 'Undo' : 'Complete'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        style={{
                                            ...styles.actionButton,
                                            backgroundColor: '#dc3545'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating AI Assistant */}
            <AIChat onTasksChanged={refreshTasks} />
        </div>
    );
}

// Styles
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        paddingBottom: '100px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #eee'
    },
    welcomeText: {
        margin: 0,
        color: '#333'
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500'
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#666'
    },
    error: {
        backgroundColor: '#fee',
        color: '#c33',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px',
        textAlign: 'center'
    },
    createCard: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
    },
    cardTitle: {
        marginTop: 0,
        marginBottom: '15px',
        color: '#333'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '15px',
        marginBottom: '15px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '5px',
        color: '#333'
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    },
    aiSuggestion: {
        backgroundColor: '#e7f3ff',
        padding: '10px 15px',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#004085',
        marginBottom: '15px',
        border: '1px solid #b8daff'
    },
    createButton: {
        width: '100%',
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '15px',
        transition: 'opacity 0.2s'
    },
    taskSection: {
        marginTop: '30px'
    },
    taskHeader: {
        marginBottom: '20px',
        color: '#333',
        marginTop: 0
    },
    emptyState: {
        textAlign: 'center',
        padding: '50px',
        backgroundColor: 'white',
        borderRadius: '8px',
        color: '#999'
    },
    taskList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    taskCard: {
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px'
    },
    taskContent: {
        flex: 1,
        minWidth: 0
    },
    priorityBadge: {
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '3px',
        fontSize: '10px',
        fontWeight: 'bold',
        marginBottom: '8px',
        marginRight: '8px'
    },
    taskTitle: {
        margin: '0 0 5px 0',
        fontSize: '16px',
        wordBreak: 'break-word'
    },
    taskDescription: {
        margin: '5px 0',
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.4'
    },
    taskMetadata: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '10px'
    },
    metaBadge: {
        fontSize: '12px',
        padding: '4px 8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        color: '#666'
    },
    taskDate: {
        color: '#999',
        fontSize: '12px'
    },
    taskActions: {
        display: 'flex',
        gap: '10px',
        flexShrink: 0,
        flexDirection: 'column'
    },
    actionButton: {
        padding: '8px 16px',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    }
};

export default Dashboard;