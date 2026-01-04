import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';

interface InfrastructureImportDialogProps {
  onClose: () => void;
}

interface FieldMapping {
  csv_column: string;
  infrastructure_field: string | null;
}

const INFRASTRUCTURE_FIELDS = [
  { value: 'name', label: 'Name *' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'model', label: 'Model' },
  { value: 'category', label: 'Category' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'ip_address', label: 'IP Address' },
  { value: 'mac_address', label: 'MAC Address' },
  { value: 'hostname', label: 'Hostname' },
  { value: 'vlan_id', label: 'VLAN ID' },
  { value: 'port_count', label: 'Port Count' },
  { value: 'location', label: 'Location' },
  { value: 'voltage', label: 'Voltage' },
  { value: 'amperage', label: 'Amperage' },
  { value: 'wattage', label: 'Wattage' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' }
];

export function InfrastructureImportDialog({ onClose }: InfrastructureImportDialogProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const refreshInfrastructure = useInfrastructureStore((state) => state.fetchEquipment);

  const [step, setStep] = useState<'select' | 'map' | 'importing' | 'complete'>('select');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping[]>([]);
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: string[] } | null>(null);

  const handleSelectFile = async () => {
    try {
      const result = await window.api.infrastructure.showImportDialog();

      if (result.canceled || !result.filePath) {
        return;
      }

      setSelectedFile(result.filePath);

      // Read CSV headers
      const headersResult = await window.api.infrastructure.readCSVHeaders(result.filePath);
      if (headersResult.success) {
        setCsvHeaders(headersResult.headers);

        // Auto-map common field names
        const autoMapping: FieldMapping[] = headersResult.headers.map(header => {
          const lowerHeader = header.toLowerCase();

          // Try to match common field names
          let matchedField: string | null = null;

          if (lowerHeader === 'name' || lowerHeader === 'equipment name') matchedField = 'name';
          else if (lowerHeader === 'manufacturer' || lowerHeader === 'make') matchedField = 'manufacturer';
          else if (lowerHeader === 'model') matchedField = 'model';
          else if (lowerHeader === 'category' || lowerHeader === 'type') matchedField = 'category';
          else if (lowerHeader === 'quantity' || lowerHeader === 'qty') matchedField = 'quantity';
          else if (lowerHeader === 'ip address' || lowerHeader === 'ip') matchedField = 'ip_address';
          else if (lowerHeader === 'mac address' || lowerHeader === 'mac') matchedField = 'mac_address';
          else if (lowerHeader === 'hostname' || lowerHeader === 'host') matchedField = 'hostname';
          else if (lowerHeader === 'vlan' || lowerHeader === 'vlan id') matchedField = 'vlan_id';
          else if (lowerHeader === 'port count' || lowerHeader === 'ports') matchedField = 'port_count';
          else if (lowerHeader === 'location') matchedField = 'location';
          else if (lowerHeader === 'voltage' || lowerHeader === 'v') matchedField = 'voltage';
          else if (lowerHeader === 'amperage' || lowerHeader === 'amps' || lowerHeader === 'a') matchedField = 'amperage';
          else if (lowerHeader === 'wattage' || lowerHeader === 'watts' || lowerHeader === 'w') matchedField = 'wattage';
          else if (lowerHeader === 'status') matchedField = 'status';
          else if (lowerHeader === 'notes' || lowerHeader === 'comments') matchedField = 'notes';

          return {
            csv_column: header,
            infrastructure_field: matchedField
          };
        });

        setFieldMapping(autoMapping);
        setStep('map');
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      alert('Failed to read CSV file');
    }
  };

  const handleFieldMappingChange = (csvColumn: string, infrastructureField: string | null) => {
    setFieldMapping(prev =>
      prev.map(mapping =>
        mapping.csv_column === csvColumn
          ? { ...mapping, infrastructure_field: infrastructureField }
          : mapping
      )
    );
  };

  const handleImport = async () => {
    if (!currentProject) return;

    try {
      setStep('importing');

      const result = await window.api.infrastructure.importCSV(
        currentProject.id,
        selectedFile,
        fieldMapping
      );

      setImportResult(result);
      setStep('complete');

      if (result.success || result.imported > 0) {
        // Refresh infrastructure list
        await refreshInfrastructure(currentProject.id);
      }
    } catch (error) {
      console.error('Error importing infrastructure:', error);
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Failed to import CSV: ' + (error instanceof Error ? error.message : 'Unknown error')]
      });
      setStep('complete');
    }
  };

  const hasMappedName = fieldMapping.some(m => m.infrastructure_field === 'name');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Infrastructure from CSV
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Select File */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import infrastructure equipment from a CSV file. The file should have headers in the first row.
              </p>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <button
                  onClick={handleSelectFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Select CSV File
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Supported format: CSV (.csv)
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                <strong>Tip:</strong> Your CSV should include at least a "Name" column. Other common columns include:
                Manufacturer, Model, Category, IP Address, Location, Port Count, etc.
              </div>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Selected File
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                  {selectedFile}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Found {csvHeaders.length} columns
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Map CSV Columns to Infrastructure Fields
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Match each CSV column to an infrastructure field. Fields marked with * are required.
                </p>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 grid grid-cols-2 gap-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <div>CSV Column</div>
                    <div>Maps To</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {fieldMapping.map((mapping) => (
                      <div key={mapping.csv_column} className="px-4 py-3 grid grid-cols-2 gap-4 items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {mapping.csv_column}
                        </div>
                        <select
                          value={mapping.infrastructure_field || ''}
                          onChange={(e) => handleFieldMappingChange(mapping.csv_column, e.target.value || null)}
                          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">-- Skip this column --</option>
                          {INFRASTRUCTURE_FIELDS.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!hasMappedName && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  <span>You must map at least the "Name" field to import equipment.</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Importing equipment...</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && importResult && (
            <div className="space-y-4">
              {importResult.success || importResult.imported > 0 ? (
                <div className="flex items-center gap-3 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <p className="font-medium">Import Successful!</p>
                    <p className="text-sm">Imported {importResult.imported} equipment items.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded">
                  <AlertCircle className="w-6 h-6" />
                  <div>
                    <p className="font-medium">Import Failed</p>
                    <p className="text-sm">No equipment items were imported.</p>
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Errors ({importResult.errors.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="px-4 py-2 text-xs text-red-600 dark:text-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {step === 'select' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            >
              Cancel
            </button>
          )}

          {step === 'map' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={!hasMappedName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition"
              >
                Import
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
