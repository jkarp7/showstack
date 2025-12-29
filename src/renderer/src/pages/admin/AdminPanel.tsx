import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Settings, Layout, AlertCircle, Database, FileText, Link2 } from 'lucide-react';
import { PasswordPrompt } from '../../components/admin/PasswordPrompt';
import { LayoutTemplateManager } from '../../components/admin/LayoutTemplateManager';
import { ApplicationSettings } from '../../components/admin/ApplicationSettings';
import { DatabaseManagement } from '../../components/admin/DatabaseManagement';
import { AuditLogging } from '../../components/admin/AuditLogging';
import { IntegrationSettings } from '../../components/admin/IntegrationSettings';

type Tab = 'layouts' | 'application' | 'database' | 'audit' | 'integration';

export function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('layouts');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { hasPassword } = await window.api.admin.hasPassword();

      if (!hasPassword) {
        // No password set, first time setup
        setIsFirstTime(true);
        setShowPasswordPrompt(true);
      } else {
        // Password exists, require authentication
        setIsFirstTime(false);
        setShowPasswordPrompt(true);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordPrompt(false);
  };

  const handlePasswordPromptClose = () => {
    // If user closes without authenticating, go back
    if (!isAuthenticated) {
      navigate('/');
    } else {
      setShowPasswordPrompt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Panel</h1>
              <p className="text-gray-600 dark:text-gray-400">Authentication required</p>
            </div>
          </div>
        </div>
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={handlePasswordPromptClose}
          onSuccess={handleAuthSuccess}
          isFirstTime={isFirstTime}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Administrator Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Fixed height section */}
      <div className="flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('layouts')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'layouts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span>Layout Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('application')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'application'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Application Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Database Management</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Audit & Logging</span>
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'integration'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Link2 className="w-5 h-5" />
              <span>Integration Settings</span>
            </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main scrollable content area */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Content */}
          <div>
            {activeTab === 'layouts' && <LayoutTemplateManager />}
            {activeTab === 'application' && <ApplicationSettings />}
            {activeTab === 'database' && <DatabaseManagement />}
            {activeTab === 'audit' && <AuditLogging />}
            {activeTab === 'integration' && <IntegrationSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}
