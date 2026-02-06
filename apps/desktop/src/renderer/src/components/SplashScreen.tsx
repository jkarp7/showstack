import { useEffect, useState } from 'react';
import { Layers, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useUser } from '../hooks/useUser';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { license, status, loading } = useUser();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    // Simulate initialization steps
    const steps = [
      { text: 'Loading application...', delay: 300 },
      { text: 'Checking license...', delay: 600 },
      { text: 'Initializing database...', delay: 900 },
      { text: 'Loading modules...', delay: 1200 },
      { text: 'Ready!', delay: 1500 },
    ];

    let currentStep = 0;

    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setStatusText(steps[currentStep].text);
        setProgress(((currentStep + 1) / steps.length) * 100);
        currentStep++;
      } else {
        clearInterval(progressInterval);
        // Wait a bit before completing
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 300);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  // Determine license display
  const getLicenseDisplay = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking license...</span>
        </div>
      );
    }

    if (!status || !status.isValid) {
      return (
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">No Active License</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-1 text-green-400">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{license?.name}</span>
        </div>
        <span className="text-xs text-gray-400">{license?.tier} License</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Layers className="w-24 h-24 text-blue-500" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          ShowStack
        </h1>
        <p className="text-gray-400 text-lg mb-8">Production Management for Live Entertainment</p>

        {/* Version */}
        <div className="mb-8">
          <span className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm font-medium">
            Version 0.1.0-alpha
          </span>
        </div>

        {/* License Status */}
        <div className="mb-8">{getLicenseDisplay()}</div>

        {/* Loading Bar */}
        <div className="w-80 mx-auto">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm text-gray-400">{statusText}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 text-gray-500 text-xs">
          <p>© 2025 Lytrix</p>
          <p className="mt-1">All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
