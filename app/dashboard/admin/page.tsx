export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">Admin</h1>
        <p className="text-gray-600 mt-2">
          Manage forms, users, roles, and facility settings
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-xl font-semibold text-navy mb-2">Admin Module</h2>
          <p>The brain of the application - Form Builder, User Management, Settings</p>
          <p className="text-sm mt-4 text-gray-400">Form Builder coming in Phase 2</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-action">
          <h3 className="text-lg font-semibold text-navy mb-2">Form Builder</h3>
          <p className="text-sm text-gray-600">
            Create and customize report templates with drag-and-drop interface
          </p>
          <p className="text-xs text-action font-semibold mt-4">Phase 2 - Next</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-wolf">
          <h3 className="text-lg font-semibold text-navy mb-2">User Management</h3>
          <p className="text-sm text-gray-600">
            Add users, assign roles, and manage permissions
          </p>
          <p className="text-xs text-gray-400 mt-4">Phase 2</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-wolf">
          <h3 className="text-lg font-semibold text-navy mb-2">Role Management</h3>
          <p className="text-sm text-gray-600">
            Define custom roles with granular permissions
          </p>
          <p className="text-xs text-gray-400 mt-4">Phase 2</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-wolf">
          <h3 className="text-lg font-semibold text-navy mb-2">Facility Settings</h3>
          <p className="text-sm text-gray-600">
            Configure rinks, shifts, retention policies, and thresholds
          </p>
          <p className="text-xs text-gray-400 mt-4">Phase 2</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-wolf">
          <h3 className="text-lg font-semibold text-navy mb-2">Data Management</h3>
          <p className="text-sm text-gray-600">
            Export data and manage compliance reports
          </p>
          <p className="text-xs text-gray-400 mt-4">Phase 7</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-wolf">
          <h3 className="text-lg font-semibold text-navy mb-2">SMS Configuration</h3>
          <p className="text-sm text-gray-600">
            Set up Twilio integration and notification preferences
          </p>
          <p className="text-xs text-gray-400 mt-4">Phase 7</p>
        </div>
      </div>
    </div>
  )
}
