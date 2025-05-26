"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Mail, Lock, User, ArrowRight } from 'lucide-react';

import { signIn } from 'next-auth/react';

import { registerAdmin } from '../../../server_actions/handleAdmin';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function AuthPage() {
  // const { data: session } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Check if user is already logged in
  const { data: session } = useSession();
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  

  const handleSubmit = async (e : React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if user is already logged in

    try {
      // Validation
      if (!isLogin && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if(!isLogin){
        await registerAdmin({username : formData.name, email : formData.email, password : formData.password});
        router.push('/login');
      }else{
        try{
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if(result?.error){
            setError('Invalid email or password');
            setLoading(false);
            return;
          }
          setLoading(false);
          router.push('/dashboard');
        }catch(err){
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Login failed');
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black bg-gray-100 flex flex-col justify-center items-center p-4">
      {/* Logo and App Name */}
      <div className="flex items-center mb-8">
        <div className="bg-blue-600 p-3 rounded-lg">
          <LayoutDashboard size={30} className="text-white" />
        </div>
        <h1 className="ml-3 text-2xl font-bold text-gray-800">Inventory System</h1>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        {/* Auth Header */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-medium text-center ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-4 font-medium text-center ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {isLogin ? 'Login to your account' : 'Create a new account'}
          </h2>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Social Auth Options */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600 mb-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleAuthMode}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Register now' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}