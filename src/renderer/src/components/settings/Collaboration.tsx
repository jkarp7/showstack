import { Users, Share2, MessageSquare, Save, AlertCircle } from 'lucide-react';

export function Collaboration() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Collaboration</h2>
        <p className="text-gray-600 dark:text-gray-400">Share projects and collaborate with team members</p>
      </div>

      <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-blue-500 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-gray-200 mb-1">Coming Soon</h4>
            <p className="text-sm text-blue-800 dark:text-gray-300">
              Real-time collaboration features are currently in development. You'll be able to share projects,
              leave comments, and work simultaneously with team members.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6 opacity-60">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Team Members</span>
        </h3>

        <div className="space-y-3">
          {['john@example.com', 'sarah@example.com'].map((email, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{email}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Editor</div>
                </div>
              </div>
              <button className="text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed">Remove</button>
            </div>
          ))}

          <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed">
            + Invite Team Member
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6 opacity-60">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Sharing Settings</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white mb-1">Default Sharing Permission</div>
            <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700 cursor-not-allowed">
              <option>View Only</option>
              <option>Can Edit</option>
              <option>Can Comment</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-6 opacity-60">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <span>Comment Notifications</span>
        </h3>

        <div className="space-y-3">
          {['Email notifications for comments', 'In-app notifications', 'Desktop notifications'].map((option, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="font-medium text-gray-900 dark:text-white">{option}</div>
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full cursor-not-allowed"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
