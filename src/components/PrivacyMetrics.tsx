import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Shield,
  TrendingUp,
  FileText,
  Download,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react';

interface Generation {
  id: string;
  dataset_id: string;
  model_type: string;
  row_count: number;
  status: string;
  created_at: string;
  dataset: {
    name: string;
  };
  privacy_metrics: Array<{
    epsilon: number;
    k_anonymity: number;
    privacy_risk_score: number;
    leakage_probability: number;
  }>;
  utility_metrics: Array<{
    fidelity_score: number;
    similarity_score: number;
    correlation_preservation: number;
    distribution_similarity: number;
    ml_efficacy_score: number;
  }>;
  compliance_reports: Array<{
    report_type: string;
    compliance_status: string;
    report_data: any;
    generated_at: string;
  }>;
}

export function PrivacyMetrics() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('synthetic_generations')
      .select(`
        *,
        dataset:datasets(name),
        privacy_metrics(*),
        utility_metrics(*),
        compliance_reports(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setGenerations(data as any);
      if (data.length > 0) {
        setSelectedGen(data[0] as any);
      }
    }
    setLoading(false);
  };

  const downloadComplianceReport = (gen: Generation) => {
    const report = gen.compliance_reports[0];
    if (!report) return;

    const content = `
KENYA DATA PROTECTION ACT COMPLIANCE REPORT
===========================================

Generated: ${new Date(report.generated_at).toLocaleString()}
Report Type: ${report.report_type}
Status: ${report.compliance_status.toUpperCase()}

Dataset Information:
-------------------
Name: ${gen.dataset.name}
Synthetic Rows: ${gen.row_count.toLocaleString()}
Model: ${gen.model_type.toUpperCase()}

Privacy Guarantees:
------------------
${report.report_data.privacy_guarantees}
Anonymization: ${report.report_data.anonymization}

Compliance Criteria:
-------------------
✓ Data Minimization: ${report.report_data.data_minimization ? 'Compliant' : 'Not Compliant'}
✓ Purpose Limitation: ${report.report_data.purpose_limitation ? 'Compliant' : 'Not Compliant'}

Privacy Metrics:
---------------
${gen.privacy_metrics[0] ? `
Differential Privacy Epsilon: ${gen.privacy_metrics[0].epsilon}
K-Anonymity Level: ${gen.privacy_metrics[0].k_anonymity}
Privacy Risk Score: ${(gen.privacy_metrics[0].privacy_risk_score * 100).toFixed(2)}%
Leakage Probability: ${(gen.privacy_metrics[0].leakage_probability * 100).toFixed(3)}%
` : 'No metrics available'}

Utility Metrics:
---------------
${gen.utility_metrics[0] ? `
Fidelity Score: ${(gen.utility_metrics[0].fidelity_score * 100).toFixed(1)}%
Similarity Score: ${(gen.utility_metrics[0].similarity_score * 100).toFixed(1)}%
Correlation Preservation: ${(gen.utility_metrics[0].correlation_preservation * 100).toFixed(1)}%
Distribution Similarity: ${(gen.utility_metrics[0].distribution_similarity * 100).toFixed(1)}%
ML Efficacy Score: ${(gen.utility_metrics[0].ml_efficacy_score * 100).toFixed(1)}%
` : 'No metrics available'}

Valid Until: ${new Date(report.report_data.valid_until).toLocaleDateString()}

---
This report certifies that the synthetic dataset meets the requirements
of the Kenya Data Protection Act, 2019.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${gen.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading metrics...</p>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Generated Yet</h3>
        <p className="text-gray-600">Generate synthetic data to view privacy and utility metrics</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Utility Metrics</h2>
        <p className="text-gray-600">Analyze the quality and privacy guarantees of your synthetic data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-3">Generation History</h3>
          <div className="space-y-2">
            {generations.map((gen) => (
              <button
                key={gen.id}
                onClick={() => setSelectedGen(gen)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedGen?.id === gen.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900 mb-1">{gen.dataset.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(gen.created_at).toLocaleDateString()} • {gen.row_count.toLocaleString()} rows
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                    {gen.model_type}
                  </span>
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedGen && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Privacy Metrics</h3>
                </div>
                {selectedGen.privacy_metrics[0]?.privacy_risk_score < 0.15 && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">High Privacy</span>
                  </div>
                )}
              </div>

              {selectedGen.privacy_metrics[0] && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Differential Privacy (ε)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedGen.privacy_metrics[0].epsilon.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Lower is more private</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">K-Anonymity</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedGen.privacy_metrics[0].k_anonymity}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Minimum group size</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Privacy Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(selectedGen.privacy_metrics[0].privacy_risk_score * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Re-identification risk</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Leakage Probability</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(selectedGen.privacy_metrics[0].leakage_probability * 100).toFixed(3)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Information leakage</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Utility Metrics</h3>
                </div>
                {selectedGen.utility_metrics[0]?.fidelity_score > 0.85 && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">High Fidelity</span>
                  </div>
                )}
              </div>

              {selectedGen.utility_metrics[0] && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Fidelity Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedGen.utility_metrics[0].fidelity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedGen.utility_metrics[0].fidelity_score * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Similarity Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedGen.utility_metrics[0].similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${selectedGen.utility_metrics[0].similarity_score * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Correlation Preservation</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedGen.utility_metrics[0].correlation_preservation * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${selectedGen.utility_metrics[0].correlation_preservation * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Distribution Similarity</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedGen.utility_metrics[0].distribution_similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${selectedGen.utility_metrics[0].distribution_similarity * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">ML Efficacy Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedGen.utility_metrics[0].ml_efficacy_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${selectedGen.utility_metrics[0].ml_efficacy_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Compliance Report</h3>
              </div>

              {selectedGen.compliance_reports[0] && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-900">Kenya Data Protection Act Compliant</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        Generated: {new Date(selectedGen.compliance_reports[0].generated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadComplianceReport(selectedGen)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Compliance Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
