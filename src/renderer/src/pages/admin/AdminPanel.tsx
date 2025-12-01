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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Authentication required</p>
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Administrator Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('layouts')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'layouts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span>Layout Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('application')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'application'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Application Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-5 h-5" />
              <span>Database Management</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Audit & Logging</span>
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'integration'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Link2 className="w-5 h-5" />
              <span>Integration Settings</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'layouts' && <LayoutTemplateManager />}
          {activeTab === 'application' && <ApplicationSettings />}
          {activeTab === 'database' && <DatabaseManagement />}
          {activeTab === 'audit' && <AuditLogging />}
          {activeTab === 'integration' && <IntegrationSettings />}
        </div>
      </div>
    </div>
  );
}
