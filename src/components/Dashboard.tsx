import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Database,
  Plus,
  Upload,
  Shield,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ProjectList } from './ProjectList';
import { DatasetUpload } from './DatasetUpload';
import { SyntheticGenerator } from './SyntheticGenerator';
import { PrivacyMetrics } from './PrivacyMetrics';

type View = 'projects' | 'upload' | 'generate' | 'metrics' | 'settings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDatasets: 0,
    totalGenerations: 0,
    recentActivity: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;

    const [projects, datasets, generations] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('datasets').select('id', { count: 'exact' }),
      supabase.from('synthetic_generations').select('id', { count: 'exact' }).eq('user_id', user.id)
    ]);

    setStats({
      totalProjects: projects.count || 0,
      totalDatasets: datasets.count || 0,
      totalGenerations: generations.count || 0,
      recentActivity: (generations.count || 0)
    });
  };

  const navigation = [
    { id: 'projects', label: 'Projects', icon: Database, view: 'projects' as View },
    { id: 'upload', label: 'Upload Data', icon: Upload, view: 'upload' as View },
    { id: 'generate', label: 'Generate', icon: TrendingUp, view: 'generate' as View },
    { id: 'metrics', label: 'Metrics', icon: Shield, view: 'metrics' as View },
    { id: 'settings', label: 'Settings', icon: Settings, view: 'settings' as View }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SynthData Kenya</h1>
                <p className="text-xs text-gray-500">Synthetic Data Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Fintech Developer</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Datasets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDatasets}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Generations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalGenerations}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentActivity}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.view)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  currentView === item.view
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {currentView === 'projects' && (
            <ProjectList
              onSelectProject={setSelectedProject}
              onNavigateToUpload={() => setCurrentView('upload')}
            />
          )}
          {currentView === 'upload' && (
            <DatasetUpload
              projectId={selectedProject}
              onUploadComplete={(datasetId) => {
                setSelectedDataset(datasetId);
                setCurrentView('generate');
                loadStats();
              }}
            />
          )}
          {currentView === 'generate' && (
            <SyntheticGenerator
              datasetId={selectedDataset}
              onGenerationComplete={() => {
                setCurrentView('metrics');
                loadStats();
              }}
            />
          )}
          {currentView === 'metrics' && <PrivacyMetrics />}
          {currentView === 'settings' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Email: {user?.email}</p>
                    <p className="text-sm text-gray-600 mt-2">User ID: {user?.id}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Compliance</h3>
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Kenya Data Protection Act Compliant</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        All generated data meets regulatory requirements
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Differential Privacy</p>
                        <p className="text-xs text-gray-600">Mathematical privacy guarantees</p>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
                        Enabled
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Auto Compliance Reports</p>
                        <p className="text-xs text-gray-600">Generate reports automatically</p>
                      </div>
                      <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium">
                        Enabled
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
