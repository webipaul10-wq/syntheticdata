import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface DatasetUploadProps {
  projectId: string | null;
  onUploadComplete: (datasetId: string) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  schema_json: any;
}

export function DatasetUpload({ projectId, onUploadComplete }: DatasetUploadProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('is_public', true)
      .order('name');

    if (data) {
      setTemplates(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv') {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setDatasetName(selectedFile.name.replace('.csv', ''));
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !projectId || !user) return;

    setUploading(true);
    setError('');

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',');

      const schema = headers.map(header => ({
        name: header.trim(),
        type: 'string',
        sensitive: header.toLowerCase().includes('id') ||
                  header.toLowerCase().includes('name') ||
                  header.toLowerCase().includes('phone')
      }));

      const { data: dataset, error: dbError } = await supabase
        .from('datasets')
        .insert([{
          project_id: projectId,
          name: datasetName,
          description: description,
          schema_json: schema,
          row_count: rows.length - 1,
          data_type: 'tabular',
          status: 'uploaded'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        onUploadComplete(dataset.id);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    if (!projectId || !user) return;

    setUploading(true);
    try {
      const { data: dataset, error: dbError } = await supabase
        .from('datasets')
        .insert([{
          project_id: projectId,
          name: `${template.name} Template`,
          description: template.description,
          schema_json: template.schema_json,
          row_count: 1000,
          data_type: 'tabular',
          status: 'uploaded'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        onUploadComplete(dataset.id);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Template creation failed');
    } finally {
      setUploading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Project Selected</h3>
        <p className="text-gray-600">Please select or create a project first</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Dataset</h2>
        <p className="text-gray-600">Upload your CSV data or use a pre-built template</p>
      </div>

      {success ? (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="bg-emerald-50 rounded-full p-4 inline-block mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Dataset Uploaded Successfully</h3>
          <p className="text-gray-600">Redirecting to generation...</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
            <form onSubmit={handleUpload} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="M-Pesa Transactions Q4 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Mobile money transaction data for Q4 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-emerald-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-1">Click to upload CSV file</p>
                        <p className="text-sm text-gray-500">or drag and drop</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Dataset'}
              </button>
            </form>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Use a Template
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Start with pre-configured schemas for common Kenyan fintech use cases
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  disabled={uploading}
                  className="text-left bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 hover:shadow-md transition-all disabled:opacity-50"
                >
                  <div className="bg-white p-2 rounded-lg inline-block mb-3">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                    {template.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
