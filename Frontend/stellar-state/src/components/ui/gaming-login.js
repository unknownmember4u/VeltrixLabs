'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

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
                className="w-full pl-10 pr-3 py-3 bg-white/20 border border-black/10 rounded-xl text-black placeholder-black/40 focus:outline-none focus:border-black/30 focus:bg-white/40 transition-colors shadow-sm"
            />
        </div>
    );
};

const SocialButton = ({ icon, name }) => {
    return (
        <button type="button" className="flex items-center justify-center w-full max-w-[200px] p-3 bg-white/30 border border-black/10 rounded-xl text-black/80 hover:bg-white/60 hover:text-black transition-all shadow-sm hover:shadow">
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
            <div className={`absolute inset-0 rounded-full transition-colors duration-200 ease-in-out pointer-events-none ${checked ? 'bg-black' : 'bg-black/20'}`}>
                <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${checked ? 'transform translate-x-5' : ''}`} />
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
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (onSubmit) onSubmit({ email, password, remember, name, isLogin });
        setIsSubmitting(false);
        setIsSuccess(false);
    };

    return (
        <div className="p-12 rounded-2xl bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)] relative transform transition-all duration-300">
            {onClose && (
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors p-1"
                  aria-label="Close"
                  type="button"
                >
                  ✕
                </button>
            )}
            
            <div className="mb-8 text-center pt-2">
                <h2 className="text-3xl font-extrabold mb-2 relative group inline-block tracking-tight text-black">
                    Stellar State
                </h2>
                <div className="text-black/60 flex flex-col items-center space-y-1 mt-1">
                    <span className="text-sm font-medium">
                        {isLogin ? "Log in to the dashboard" : "Create a new account"}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <FormInput
                        icon={<span className="text-black/40 font-bold ml-1 flex items-center justify-center">@</span>}
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}

                <FormInput
                    icon={<Mail className="text-black/40" size={18} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="relative">
                    <FormInput
                        icon={<Lock className="text-black/40" size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {isLogin && (
                    <div className="flex items-center pb-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <ToggleSwitch
                                checked={remember}
                                onChange={() => setRemember(!remember)}
                                id="remember-me"
                            />
                            <label
                                htmlFor="remember-me"
                                className="text-sm font-medium text-black/70 cursor-pointer hover:text-black transition-colors select-none"
                            >
                                Remember me
                            </label>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl ${isSuccess
                            ? 'bg-green-500'
                            : 'bg-black hover:bg-[#222]'
                        } text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                    {isSubmitting 
                        ? (isLogin ? 'Authenticating...' : 'Creating account...') 
                        : (isLogin ? 'Sign In' : 'Create Account')
                    }
                </button>
            </form>

            <div className="mt-8">
                <div className="relative flex items-center justify-center">
                    <div className="border-t border-black/10 absolute w-full"></div>
                    <div className="px-4 relative text-black/40 text-xs font-bold uppercase tracking-wider bg-transparent">
                        Or continue with
                    </div>
                </div>

                <div className="mt-6 flex justify-center w-full">
                    <SocialButton icon={<GoogleIcon />} name="Google" />
                </div>
            </div>

            <p className="mt-8 text-center text-sm font-medium text-black/60">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    type="button" 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="font-bold text-black hover:underline transition-all"
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
