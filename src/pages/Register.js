import React, { useState } from 'react';
import { authAPI } from '../services/api';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register(formData);
            localStorage.setItem('auth_token', response.data.data.access_token);
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Animated Background */}
            <div style={styles.backgroundShapes}>
                <div style={styles.shape1}></div>
                <div style={styles.shape2}></div>
                <div style={styles.shape3}></div>
            </div>

            {/* Register Card */}
            <div style={styles.card}>
                {/* Header with Logo Only */}
                <div style={styles.header}>
                    <div style={styles.logoContainer}>
                        <img
                            src="/fulkrum-logo.png"
                            alt="Fulkrum Interactive"
                            style={styles.logoImage}
                        />
                    </div>
                    <p style={styles.subtitle}>Create your account to get started</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={styles.error}>
                        <span style={styles.errorIcon}>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Name Input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="John Doe"
                            autoComplete="name"
                        />
                    </div>

                    {/* Email Input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={styles.input}
                            placeholder="your@email.com"
                            autoComplete="email"
                        />
                    </div>

                    {/* Password Input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            
                            Password
                        </label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.togglePassword}
                                tabIndex="-1"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            
                            Confirm Password
                        </label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                required
                                style={styles.input}
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.togglePassword}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(234, 113, 35, 0.55)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 113, 35, 0.4)';
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={styles.spinner}></span>
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        Already have an account?{' '}
                        <a href="/login" style={styles.link}>
                            Sign in →
                        </a>
                    </p>
                </div>

                {/* Features */}
                <div style={styles.features}>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>🤖</span>
                        <span style={styles.featureText}>AI-Powered</span>
                    </div>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>🎤</span>
                        <span style={styles.featureText}>Voice Control</span>
                    </div>
                    <div style={styles.feature}>
                        <span style={styles.featureIcon}>📊</span>
                        <span style={styles.featureText}>Smart Analytics</span>
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div style={styles.bottomInfo}>
                <p style={styles.bottomText}>
                    © 2026 Fulkrum Interactive • Secure • Fast • Intelligent
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        // 🔶 Orange gradient — same as Login
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        padding: '20px',
        overflow: 'hidden'
    },
    backgroundShapes: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
    },
    shape1: {
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        top: '-120px',
        right: '-100px',
        animation: 'float 6s ease-in-out infinite'
    },
    shape2: {
        position: 'absolute',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.06)',
        bottom: '50px',
        left: '-60px',
        animation: 'float 8s ease-in-out infinite'
    },
    shape3: {
        position: 'absolute',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'rgba(255, 200, 100, 0.1)',
        top: '50%',
        left: '10%',
        animation: 'float 7s ease-in-out infinite'
    },
    card: {
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'white',
        padding: '48px 48px 40px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '480px',
        backdropFilter: 'blur(10px)'
    },
    header: {
        textAlign: 'center',
        marginBottom: '28px'   // consistent with Login
    },
    logoContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '8px',   // tight gap, same as Login
        padding: '0px'         // no padding, no phantom space
    },
    logoImage: {
        width: '160px',
        height: 'auto',        // auto height — no whitespace issues
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(0 2px 12px rgba(0, 0, 0, 0.08))'
    },
    subtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#9ca3af',
        fontWeight: '400',
        letterSpacing: '0.3px'
    },
    error: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#fff7ed',
        color: '#9a3412',
        padding: '14px 16px',
        borderRadius: '12px',
        marginBottom: '24px',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #fed7aa'   // orange-tinted error border
    },
    errorIcon: {
        fontSize: '18px'
    },
    form: {
        marginBottom: '24px'
    },
    inputGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        color: '#374151',
        fontWeight: '600',
        fontSize: '14px'
    },
    labelIcon: {
        fontSize: '16px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        fontSize: '15px',
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxSizing: 'border-box',
        backgroundColor: '#f9fafb'
    },
    passwordWrapper: {
        position: 'relative',
        width: '100%'
    },
    togglePassword: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.6,
        transition: 'opacity 0.2s'
    },
    button: {
        width: '100%',
        padding: '16px',
        // 🔶 Orange gradient button — same as Login
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(234, 113, 35, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid white',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block'
    },
    footer: {
        textAlign: 'center',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb'
    },
    footerText: {
        margin: 0,
        fontSize: '14px',
        color: '#6b7280'
    },
    link: {
        color: '#ea580c',   // 🔶 orange link — same as Login
        textDecoration: 'none',
        fontWeight: '600',
        transition: 'color 0.2s'
    },
    features: {
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb'
    },
    feature: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
    },
    featureIcon: {
        fontSize: '24px'
    },
    featureText: {
        fontSize: '11px',
        color: '#9ca3af',
        fontWeight: '500'
    },
    bottomInfo: {
        position: 'relative',
        zIndex: 1,
        marginTop: '24px'
    },
    bottomText: {
        margin: 0,
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
        letterSpacing: '0.5px'
    }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    input:focus {
        border-color: #f97316 !important;
        background-color: white !important;
        box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12) !important;
    }

    a:hover {
        color: #c2410c !important;
    }

    button[type="button"]:hover {
        opacity: 1 !important;
    }
`;
document.head.appendChild(styleSheet);

export default Register;