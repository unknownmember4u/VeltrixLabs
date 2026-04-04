'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FormInput = ({ icon, type, placeholder, value, onChange, required }) => {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {icon}
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-colors shadow-sm"
            />
        </div>
    );
};

const SocialButton = ({ icon, name, onClick }) => {
    return (
        <button type="button" onClick={onClick} className="flex items-center justify-center w-full max-w-[200px] p-3 bg-white/10 border border-white/20 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-all shadow-sm hover:shadow">
            {icon}
            {name && <span className="ml-2 font-medium">{name}</span>}
        </button>
    );
};

const ToggleSwitch = ({ checked, onChange, id }) => {
    return (
        <div className="relative inline-block w-10 h-5 cursor-pointer">
            <input
                type="checkbox"
                id={id}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0"
                checked={checked}
                onChange={onChange}
            />
            <div className={`absolute inset-0 rounded-full transition-colors duration-200 ease-in-out pointer-events-none ${checked ? 'bg-white' : 'bg-white/20'}`}>
                <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-black transition-transform duration-200 ease-in-out shadow-sm ${checked ? 'transform translate-x-5' : ''}`} />
            </div>
        </div>
    );
};

const VideoBackground = ({ videoUrl }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.error("Video autoplay failed:", error);
            });
        }
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-black/40 z-10" />
            <video
                ref={videoRef}
                className="absolute inset-0 min-w-full min-h-full object-cover w-auto h-auto scale-[1.15]"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

const LoginForm = ({ onSubmit, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!isLogin && password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            let result;
            if (isLogin) {
                result = await signInWithEmailAndPassword(auth, email, password);
            } else {
                result = await createUserWithEmailAndPassword(auth, email, password);
                if (name.trim()) {
                    await updateProfile(result.user, { displayName: name.trim() });
                }
            }
            setIsSuccess(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            if (onSubmit) onSubmit({ user: result.user });
        } catch (err) {
            console.error('Auth error:', err);
            const messages = {
                'auth/invalid-email': 'Invalid email address.',
                'auth/user-not-found': 'No account found. Try signing up instead.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-credential': 'Invalid email or password.',
                'auth/email-already-in-use': 'This email is already registered. Switching to Sign In...',
                'auth/weak-password': 'Password must be at least 6 characters.',
                'auth/too-many-requests': 'Too many attempts. Please try again later.',
            };
            setError(messages[err.code] || err.message);

            // Auto-switch to sign in if email already exists
            if (err.code === 'auth/email-already-in-use') {
                setTimeout(() => setIsLogin(true), 1500);
            }
            // Auto-switch to sign up if user not found
            if (err.code === 'auth/user-not-found') {
                setTimeout(() => setIsLogin(false), 1500);
            }
        }
        
        setIsSubmitting(false);
        setIsSuccess(false);
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            if (onSubmit) onSubmit({ user: result.user });
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            setError(err.message);
        }
    };

    return (
        <div className="p-12 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)] relative transform transition-all duration-300">
            {onClose && (
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
                  aria-label="Close"
                  type="button"
                >
                  ✕
                </button>
            )}
            
            <div className="mb-8 text-center pt-2">
                <h2 className="text-3xl font-extrabold mb-2 relative group inline-block tracking-tight text-white">
                    Stellar State
                </h2>
                <div className="text-white/60 flex flex-col items-center space-y-1 mt-1">
                    <span className="text-sm font-medium">
                        {isLogin ? "Log in to the dashboard" : "Create a new account"}
                    </span>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <FormInput
                        icon={<User className="text-white/40" size={18} />}
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}

                <FormInput
                    icon={<Mail className="text-white/40" size={18} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="relative">
                    <FormInput
                        icon={<Lock className="text-white/40" size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {!isLogin && (
                    <FormInput
                        icon={<Lock className="text-white/40" size={18} />}
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl ${isSuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-white hover:bg-white/90 text-black'
                    } font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {isSubmitting 
                        ? (isLogin ? 'Signing in...' : 'Creating account...') 
                        : (isLogin ? 'Sign In' : 'Create Account')
                    }
                </button>
            </form>

            <div className="mt-8">
                <div className="relative flex items-center justify-center">
                    <div className="border-t border-white/20 absolute w-full"></div>
                    <div className="px-4 relative text-white/40 text-xs font-bold uppercase tracking-wider bg-transparent">
                        Or continue with
                    </div>
                </div>

                <div className="mt-6 flex justify-center w-full">
                    <SocialButton onClick={handleGoogleSignIn} icon={<GoogleIcon />} name="Google" />
                </div>
            </div>

            <p className="mt-8 text-center text-sm font-medium text-white/60">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    type="button" 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                    className="font-bold text-white hover:underline transition-all"
                >
                    {isLogin ? "Sign up" : "Sign in"}
                </button>
            </p>
        </div>
    );
};

const LoginPage = {
    LoginForm,
    VideoBackground
};

export default LoginPage;
