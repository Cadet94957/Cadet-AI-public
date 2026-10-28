import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        // Handle registration
        const displayName = `${firstName} ${lastName}`;
        const userData = {
          firstName,
          lastName,
          displayName,
          role: 'employee' as const
        };
        
        const { error } = await signUp(email, password, userData);
        if (error) {
          toast({
            title: "Registration Failed", 
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome to Cadet!",
            description: "Your account has been created successfully.",
          });
          setIsLogin(true); // Switch to login mode after successful registration
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8F8F0' }}>
      <div className="w-full max-w-sm">
        {/* CADET Logo */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-wide text-gray-800">CADET</h1>
          <p className="text-gray-600 mt-2 font-light tracking-wide">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </p>
        </div>

        {/* Animated Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields - Only visible during signup */}
          <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ease-in-out ${
            isLogin 
              ? 'opacity-0 max-h-0 overflow-hidden pointer-events-none' 
              : 'opacity-100 max-h-20'
          }`}>
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full px-0 py-3 text-gray-800 bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-600 focus:outline-none transition-colors duration-200 text-center"
                style={{ 
                  fontFamily: "'Caveat', cursive",
                  fontSize: '20px',
                  color: '#6b7280'
                }}
                data-testid="input-first-name"
                required={!isLogin}
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full px-0 py-3 text-gray-800 bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-600 focus:outline-none transition-colors duration-200 text-center"
                style={{ 
                  fontFamily: "'Caveat', cursive",
                  fontSize: '20px',
                  color: '#6b7280'
                }}
                data-testid="input-last-name"
                required={!isLogin}
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-0 py-3 text-gray-800 text-lg bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-600 focus:outline-none transition-colors duration-200 text-center"
              style={{ 
                fontFamily: "'Caveat', cursive",
                fontSize: '24px',
                color: '#6b7280'
              }}
              data-testid="input-email"
              required
            />
          </div>


          {/* Password Input */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-0 py-3 text-gray-800 text-lg bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-600 focus:outline-none transition-colors duration-200 text-center"
              style={{ 
                fontFamily: "'Caveat', cursive",
                fontSize: '24px',
                color: '#6b7280'
              }}
              data-testid="input-password"
              required
            />
          </div>

          {/* Confirm Password - Only visible during signup */}
          <div className={`transition-all duration-500 ease-in-out ${
            isLogin 
              ? 'opacity-0 max-h-0 overflow-hidden pointer-events-none' 
              : 'opacity-100 max-h-20'
          }`}>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-0 py-3 text-gray-800 bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-600 focus:outline-none transition-colors duration-200 text-center"
                style={{ 
                  fontFamily: "'Caveat', cursive",
                  fontSize: '20px',
                  color: '#6b7280'
                }}
                data-testid="input-confirm-password"
                required={!isLogin}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50"
              style={{ 
                fontFamily: "'Caveat', cursive",
                fontSize: '16px'
              }}
              data-testid="button-submit"
            >
              {isLoading 
                ? 'Loading...' 
                : isLogin 
                  ? 'Press Enter to continue' 
                  : 'Create Account'
              }
            </button>
          </div>

          {/* Toggle Login/Signup */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-sm underline"
              style={{ 
                fontFamily: "'Caveat', cursive",
                fontSize: '14px'
              }}
              data-testid="toggle-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}