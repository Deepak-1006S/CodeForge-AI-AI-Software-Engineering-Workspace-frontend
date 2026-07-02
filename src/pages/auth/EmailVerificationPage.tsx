import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatedBackground } from '../../components/auth/premium/AnimatedBackground';
import { GlassmorphicCard } from '../../components/auth/premium/GlassmorphicCard';
import { PremiumButton } from '../../components/auth/premium/PremiumButton';
import * as authService from '../../services/auth.service';

export const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  const verifyEmail = useCallback(async (verificationToken: string) => {
    try {
      try {
        const response = await authService.verifyEmail(verificationToken);
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
        toast.success('Email verified! You can now log in.');

        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('An error occurred during verification');
      toast.error('Network error. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      void verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token, verifyEmail]);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60" />
            <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent"
          >
            Email Verification
          </motion.h1>
        </motion.div>

        <GlassmorphicCard className="p-8 group">
          <div className="text-center space-y-6">
            {status === 'verifying' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <Loader2 className="w-16 h-16 text-indigo-400 mx-auto animate-spin" />
                <p className="text-gray-300 text-lg">{message}</p>
                <p className="text-gray-500 text-sm">Please wait while we verify your email address...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">{message}</h2>
                <p className="text-gray-400">Redirecting you to login page...</p>
                
                <PremiumButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={ArrowRight}
                  onClick={() => navigate('/auth/login')}
                  className="mt-4"
                >
                  Go to Login
                </PremiumButton>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
                <p className="text-gray-400">{message}</p>
                
                <div className="space-y-3 mt-6">
                  <PremiumButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/auth/login')}
                  >
                    Back to Login
                  </PremiumButton>
                  
                  <PremiumButton
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/auth/register')}
                  >
                    Create New Account
                  </PremiumButton>
                </div>
              </motion.div>
            )}
          </div>
        </GlassmorphicCard>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <p className="text-gray-500 text-sm">
            Need help?{' '}
            <a href="mailto:support@codeforgeai.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Contact Support
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
