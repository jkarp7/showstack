import { useValidation } from '../../hooks/useValidation';
import { ValidationIssue, ValidationSeverity } from '../../types/validation';

function SeverityIcon({ severity }: { severity: ValidationSeverity }) {
  if (severity === 'error') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">
        !
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
      ⚠
    </span>
  );
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <SeverityIcon severity={issue.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{issue.type}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{issue.message}</div>
      </div>
      <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-0.5">
        {issue.sidebarItem}
      </span>
    </div>
  );
}

export function ShowHealth() {
  const { issues } = useValidation();

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Show Health</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Passive validation — issues update automatically as data changes.
          </p>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              errors.length
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="font-bold">{errors.length}</span> error
            {errors.length !== 1 ? 's' : ''}
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              warnings.length
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="font-bold">{warnings.length}</span> warning
            {warnings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* All clear */}
        {!issues.length && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-10 text-center">
            <div className="text-3xl mb-3">✓</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No issues found
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Your show data looks good.
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Errors
              </span>
            </div>
            {errors.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Warnings
              </span>
            </div>
            {warnings.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
