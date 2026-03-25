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
    const [filter, setFilter] = useState('all');

    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskEstimatedHours, setTaskEstimatedHours] = useState('');

    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

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

    const refreshTasks = async () => {
        try {
            const response = await tasksAPI.getAll();
            setTasks(response.data.data);
        } catch (error) {
            console.error('Error refreshing tasks:', error);
        }
    };

    const analyzeTaskWithAI = async () => {
        if (!newTask.trim() || !taskDueDate) return;

        setAiAnalyzing(true);
        setAiSuggestion(null);

        try {
            console.log('🔍 Calling AI analysis...', { task_title: newTask, due_date: taskDueDate });
            
            const response = await aiAPI.analyzeTask({
                task_title: newTask,      // ✅ FIXED: Changed from 'title' to 'task_title'
                due_date: taskDueDate
            });

            console.log('✅ AI Response:', response);

            const { priority, estimated_hours, reasoning } = response.data.data;
            setTaskPriority(priority);
            setTaskEstimatedHours(estimated_hours.toString());
            setAiSuggestion(reasoning);
        } catch (error) {
            console.error('❌ AI analysis error:', error);
            console.error('❌ Error response:', error.response?.data);
            setAiSuggestion('AI analysis unavailable - please set manually');
        } finally {
            setAiAnalyzing(false);
        }
    };

    useEffect(() => {
        if (taskDueDate && newTask.trim()) {
            analyzeTaskWithAI();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskDueDate, newTask]);

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
            const taskData = { title: newTask, priority: taskPriority };
            if (taskDueDate) taskData.due_date = taskDueDate;
            if (taskEstimatedHours) taskData.estimated_hours = parseInt(taskEstimatedHours);

            const response = await tasksAPI.create(taskData);
            setTasks([response.data.data, ...tasks]);

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
            setTasks(tasks.map(t => t.id === task.id ? response.data.data : t));
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

    const filteredTasks = tasks.filter(task => {
        if (filter === 'pending') return !task.is_completed;
        if (filter === 'completed') return task.is_completed;
        return true;
    });

    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => !t.is_completed).length,
        completed: tasks.filter(t => t.is_completed).length,
        overdue: tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length,
        highPriority: tasks.filter(t => !t.is_completed && t.priority === 'high').length
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Loading your workspace...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <img
                            src="/fulkrum-logo.png"
                            alt="Fulkrum Interactive"
                            style={styles.headerLogo}
                        />
                        <div style={styles.headerDivider}></div>
                        <div>
                            <p style={styles.headerSubtitle}>Task Management System</p>
                            <p style={styles.welcomeText}>Welcome back, <strong>{user?.name}</strong></p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout →
                    </button>
                </div>
            </header>

            {error && (
                <div style={styles.error}>
                    <span>Warning:</span> {error}
                </div>
            )}

            {/* Stats */}
            <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderTop: '4px solid #6b7280' }}>
                    
                    <div>
                        <div style={styles.statValue}>{stats.total}</div>
                        <div style={styles.statLabel}>Total Tasks</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #f97316' }}>
                    
                    <div>
                        <div style={styles.statValue}>{stats.pending}</div>
                        <div style={styles.statLabel}>Pending</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #10b981' }}>
                    
                    <div>
                        <div style={styles.statValue}>{stats.completed}</div>
                        <div style={styles.statLabel}>Completed</div>
                    </div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #ef4444' }}>
                    
                    <div>
                        <div style={styles.statValue}>{stats.overdue}</div>
                        <div style={styles.statLabel}>Overdue</div>
                    </div>
                </div>
            </div>

            {/* Multi-Agent Section */}
            <MultiAgent onTasksCreated={refreshTasks} />

            {/* Create Task Form */}
            <div style={styles.createCard}>
                <div style={styles.createHeader}>
                    <h2 style={styles.createTitle}>Create New Task</h2>
                    {aiAnalyzing && (
                        <span style={styles.aiAnalyzingBadge}>
                            AI Analyzing...
                        </span>
                    )}
                </div>

                <form onSubmit={handleCreateTask}>
                    <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>What needs to be done? *</label>
                            <input
                                type="text"
                                placeholder="E.g., Prepare presentation for client meeting..."
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                style={styles.inputLarge}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Due Date</label>
                            <input
                                type="datetime-local"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Priority {aiSuggestion && '(AI)'}</label>
                            <select
                                value={taskPriority}
                                onChange={(e) => setTaskPriority(e.target.value)}
                                style={{
                                    ...styles.select,
                                    backgroundColor: aiSuggestion ? '#fff7ed' : 'white',
                                    borderColor: aiSuggestion ? '#f97316' : '#e5e7eb'
                                }}
                                disabled={aiAnalyzing}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Est. Hours {aiSuggestion && '(AI)'}</label>
                            <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                placeholder="2"
                                value={taskEstimatedHours}
                                onChange={(e) => setTaskEstimatedHours(e.target.value)}
                                style={{
                                    ...styles.input,
                                    backgroundColor: aiSuggestion ? '#fff7ed' : 'white',
                                    borderColor: aiSuggestion ? '#f97316' : '#e5e7eb'
                                }}
                                disabled={aiAnalyzing}
                            />
                        </div>
                    </div>

                    {aiSuggestion && (
                        <div style={styles.aiSuggestion}>
                            <div>
                                <div style={styles.aiSuggestionTitle}>AI Analysis</div>
                                <div style={styles.aiSuggestionText}>{aiSuggestion}</div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            ...styles.createButton,
                            opacity: aiAnalyzing ? 0.6 : 1,
                            cursor: aiAnalyzing ? 'not-allowed' : 'pointer'
                        }}
                        disabled={aiAnalyzing}
                    >
                        {aiAnalyzing ? 'Analyzing...' : 'Create Task'}
                    </button>
                </form>
            </div>

            {/* Task List */}
            <div style={styles.taskSection}>
                <div style={styles.taskHeader}>
                    <h2 style={styles.taskTitle}>Your Tasks</h2>

                    <div style={styles.filterTabs}>
                        {['all', 'pending', 'completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    ...styles.filterTab,
                                    ...(filter === f ? styles.filterTabActive : {})
                                }}
                            >
                                {f === 'all' && `All (${stats.total})`}
                                {f === 'pending' && `Pending (${stats.pending})`}
                                {f === 'completed' && `Completed (${stats.completed})`}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredTasks.length === 0 ? (
                    <div style={styles.emptyState}>
                        <h3 style={styles.emptyTitle}>
                            {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                        </h3>
                        <p style={styles.emptyText}>
                            {filter === 'completed'
                                ? 'Complete some tasks to see them here!'
                                : 'Create your first task to get started'}
                        </p>
                    </div>
                ) : (
                    <div style={styles.taskList}>
                        {filteredTasks.map(task => {
                            const isOverdue = !task.is_completed && task.due_date && new Date(task.due_date) < new Date();

                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        ...styles.taskCard,
                                        opacity: task.is_completed ? 0.7 : 1,
                                        borderLeft: `4px solid ${
                                            isOverdue ? '#ef4444' :
                                            task.priority === 'high' ? '#ef4444' :
                                            task.priority === 'medium' ? '#f97316' :
                                            '#10b981'
                                        }`
                                    }}
                                >
                                    <div style={styles.taskCardContent}>
                                        {/* Priority badge — coloured dot, no emojis */}
                                        <div style={styles.taskBadges}>
                                            <span style={{
                                                ...styles.badge,
                                                ...getBadgeStyle(task.priority)
                                            }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '7px',
                                                    height: '7px',
                                                    borderRadius: '50%',
                                                    backgroundColor:
                                                        task.priority === 'high' ? '#ef4444' :
                                                        task.priority === 'medium' ? '#f97316' : '#10b981',
                                                    marginRight: '6px',
                                                    flexShrink: 0
                                                }}></span>
                                                {task.priority?.toUpperCase()}
                                            </span>

                                            {isOverdue && (
                                                <span style={{
                                                    ...styles.badge,
                                                    backgroundColor: '#fee2e2',
                                                    color: '#991b1b'
                                                }}>
                                                    ! OVERDUE
                                                </span>
                                            )}
                                        </div>

                                        {/* Task title */}
                                        <h3 style={{
                                            ...styles.taskCardTitle,
                                            textDecoration: task.is_completed ? 'line-through' : 'none',
                                            color: task.is_completed ? '#9ca3af' : '#111827'
                                        }}>
                                            {task.is_completed && (
                                                <span style={styles.checkmark}>✓ </span>
                                            )}
                                            {task.title}
                                        </h3>

                                        {task.description && (
                                            <p style={styles.taskCardDescription}>{task.description}</p>
                                        )}

                                        {/* Metadata — plain text labels, no emojis */}
                                        <div style={styles.taskMeta}>
                                            {task.due_date && (
                                                <span style={styles.metaItem}>
                                                    Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                            {task.estimated_hours && (
                                                <span style={styles.metaItem}>
                                                    Est: {task.estimated_hours}h
                                                </span>
                                            )}
                                            <span style={styles.metaItem}>
                                                Created: {new Date(task.created_at).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action buttons — text only, no emojis */}
                                    <div style={styles.taskCardActions}>
                                        <button
                                            onClick={() => handleToggleComplete(task)}
                                            style={{
                                                ...styles.actionBtn,
                                                backgroundColor: task.is_completed ? '#f59e0b' : '#10b981'
                                            }}
                                        >
                                            {task.is_completed ? 'Undo' : 'Done'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            style={{
                                                ...styles.actionBtn,
                                                backgroundColor: '#ef4444'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating AI Assistant */}
            <AIChat onTasksChanged={refreshTasks} />
        </div>
    );
}

function getBadgeStyle(priority) {
    switch (priority) {
        case 'high':   return { backgroundColor: '#fef2f2', color: '#991b1b' };
        case 'medium': return { backgroundColor: '#fff7ed', color: '#9a3412' };
        case 'low':    return { backgroundColor: '#f0fdf4', color: '#166534' };
        default:       return {};
    }
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        padding: '20px',
        paddingBottom: '100px'
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        color: 'white',
        marginTop: '20px',
        fontSize: '16px'
    },
    header: {
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '16px 32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        maxWidth: '1400px',
        margin: '0 auto 24px auto'
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    headerLogo: {
        height: '48px',
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))'
    },
    headerDivider: {
        width: '1px',
        height: '36px',
        backgroundColor: '#e5e7eb'
    },
    headerSubtitle: {
        margin: 0,
        fontSize: '13px',
        color: '#9ca3af',
        fontWeight: '500'
    },
    welcomeText: {
        margin: '2px 0 0 0',
        color: '#374151',
        fontSize: '14px'
    },
    logoutButton: {
        padding: '10px 24px',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 12px rgba(234, 113, 35, 0.4)'
    },
    error: {
        background: 'white',
        color: '#ef4444',
        padding: '16px 24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '1400px',
        margin: '0 auto 24px auto',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        maxWidth: '1400px',
        margin: '0 auto 24px auto'
    },
    statCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default'
    },
    statEmoji: {
        fontSize: '32px'
    },
    statValue: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#111827',
        lineHeight: '1'
    },
    statLabel: {
        fontSize: '13px',
        color: '#6b7280',
        marginTop: '4px',
        fontWeight: '500'
    },
    createCard: {
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        maxWidth: '1400px',
        margin: '0 auto 24px auto'
    },
    createHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    createTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827'
    },
    aiAnalyzingBadge: {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '16px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#374151'
    },
    inputLarge: {
        padding: '14px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '10px',
        fontSize: '15px',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none'
    },
    input: {
        padding: '12px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none'
    },
    select: {
        padding: '12px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        cursor: 'pointer',
        backgroundColor: 'white'
    },
    aiSuggestion: {
        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        border: '2px solid #fed7aa'
    },
    aiSuggestionTitle: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#9a3412',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '4px'
    },
    aiSuggestionText: {
        fontSize: '14px',
        color: '#7c2d12',
        lineHeight: '1.5'
    },
    createButton: {
        width: '100%',
        padding: '14px 24px',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 12px rgba(234, 113, 35, 0.4)',
        letterSpacing: '0.3px'
    },
    taskSection: {
        maxWidth: '1400px',
        margin: '0 auto'
    },
    taskHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    taskTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: '700',
        color: 'white'
    },
    filterTabs: {
        display: 'flex',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '4px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
    },
    filterTab: {
        padding: '8px 16px',
        background: 'transparent',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '13px',
        transition: 'background 0.2s'
    },
    filterTabActive: {
        background: 'white',
        color: '#ea580c'
    },
    emptyState: {
        background: 'white',
        borderRadius: '16px',
        padding: '60px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
    },
    emptyTitle: {
        margin: '0 0 8px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827'
    },
    emptyText: {
        margin: 0,
        fontSize: '14px',
        color: '#6b7280'
    },
    taskList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    taskCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    taskCardContent: {
        flex: 1,
        minWidth: 0
    },
    taskBadges: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        display: 'inline-flex',
        alignItems: 'center'
    },
    taskCardTitle: {
        margin: '0 0 8px 0',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.4',
        wordBreak: 'break-word'
    },
    checkmark: {
        color: '#10b981',
        marginRight: '4px'
    },
    taskCardDescription: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5'
    },
    taskMeta: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px'
    },
    metaItem: {
        fontSize: '12px',
        color: '#9ca3af',
        fontWeight: '500'
    },
    taskCardActions: {
        display: 'flex',
        gap: '8px',
        flexShrink: 0,
        alignItems: 'flex-start'
    },
    // Text-only buttons — no fixed width, padding-based
    actionBtn: {
        height: '36px',
        padding: '0 16px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s, opacity 0.2s',
        color: 'white',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap'
    }
};

// CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    input:focus, select:focus {
        border-color: #f97316 !important;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12) !important;
    }
`;
document.head.appendChild(styleSheet);

export default Dashboard;