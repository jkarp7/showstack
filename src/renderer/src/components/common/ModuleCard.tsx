import { useNavigate } from 'react-router-dom';

interface ModuleCardProps {
  name: string;
  description: string;
  icon: string;
  route: string;
  isLocked?: boolean;
}

export function ModuleCard({ name, description, icon, route, isLocked = false }: ModuleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isLocked) {
      navigate(route);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`
        relative p-8 rounded-lg border-2 text-left transition-all
        ${isLocked
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-60'
          : 'border-gray-700 bg-gray-800 hover:border-blue-500 hover:bg-gray-750 cursor-pointer'
        }
      `}
    >
      {isLocked && (
        <div className="absolute top-4 right-4">
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{name}</h2>
      <p className="text-gray-400">{description}</p>

      {isLocked && (
        <div className="mt-4 text-sm text-gray-500">
          Available with premium subscription
        </div>
      )}
    </button>
  );
}
