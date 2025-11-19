import { useState, useEffect } from 'react';
import { Project, ShowDates } from '../../store/projectStore';

interface EditProjectDialogProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (projectId: string, updates: Partial<Project>) => void;
}

export function EditProjectDialog({ isOpen, project, onClose, onSave }: EditProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [venue, setVenue] = useState('');

  // Design team
  const [lightingDesigner, setLightingDesigner] = useState('');
  const [lightingDesignerEmail, setLightingDesignerEmail] = useState('');
  const [lightingDesignerPhone, setLightingDesignerPhone] = useState('');
  const [audioDesigner, setAudioDesigner] = useState('');
  const [audioDesignerEmail, setAudioDesignerEmail] = useState('');
  const [audioDesignerPhone, setAudioDesignerPhone] = useState('');
  const [videoDesigner, setVideoDesigner] = useState('');
  const [videoDesignerEmail, setVideoDesignerEmail] = useState('');
  const [videoDesignerPhone, setVideoDesignerPhone] = useState('');

  // Production staff
  const [electrician, setElectrician] = useState('');
  const [electricianEmail, setElectricianEmail] = useState('');
  const [electricianPhone, setElectricianPhone] = useState('');
  const [audioTech, setAudioTech] = useState('');
  const [audioTechEmail, setAudioTechEmail] = useState('');
  const [audioTechPhone, setAudioTechPhone] = useState('');
  const [videoTech, setVideoTech] = useState('');
  const [videoTechEmail, setVideoTechEmail] = useState('');
  const [videoTechPhone, setVideoTechPhone] = useState('');
  const [productionManager, setProductionManager] = useState('');
  const [productionManagerEmail, setProductionManagerEmail] = useState('');
  const [productionManagerPhone, setProductionManagerPhone] = useState('');
  const [productionManagerCompany, setProductionManagerCompany] = useState('');
  const [generalManager, setGeneralManager] = useState('');
  const [generalManagerEmail, setGeneralManagerEmail] = useState('');
  const [generalManagerPhone, setGeneralManagerPhone] = useState('');
  const [generalManagerCompany, setGeneralManagerCompany] = useState('');

  // Show dates
  const [loadIn, setLoadIn] = useState('');
  const [tech, setTech] = useState('');
  const [previews, setPreviews] = useState('');
  const [opening, setOpening] = useState('');
  const [closing, setClosing] = useState('');
  const [loadOut, setLoadOut] = useState('');

  const [enabledModules, setEnabledModules] = useState<string[]>(['production']);

  // Initialize form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setLogoPath(project.logo_path || '');
      setVenue(project.venue || '');

      setLightingDesigner(project.lighting_designer || '');
      setLightingDesignerEmail(project.lighting_designer_email || '');
      setLightingDesignerPhone(project.lighting_designer_phone || '');
      setAudioDesigner(project.audio_designer || '');
      setAudioDesignerEmail(project.audio_designer_email || '');
      setAudioDesignerPhone(project.audio_designer_phone || '');
      setVideoDesigner(project.video_designer || '');
      setVideoDesignerEmail(project.video_designer_email || '');
      setVideoDesignerPhone(project.video_designer_phone || '');

      setElectrician(project.electrician || '');
      setElectricianEmail(project.electrician_email || '');
      setElectricianPhone(project.electrician_phone || '');
      setAudioTech(project.audio_tech || '');
      setAudioTechEmail(project.audio_tech_email || '');
      setAudioTechPhone(project.audio_tech_phone || '');
      setVideoTech(project.video_tech || '');
      setVideoTechEmail(project.video_tech_email || '');
      setVideoTechPhone(project.video_tech_phone || '');
      setProductionManager(project.production_manager || '');
      setProductionManagerEmail(project.production_manager_email || '');
      setProductionManagerPhone(project.production_manager_phone || '');
      setProductionManagerCompany(project.production_manager_company || '');
      setGeneralManager(project.general_manager || '');
      setGeneralManagerEmail(project.general_manager_email || '');
      setGeneralManagerPhone(project.general_manager_phone || '');
      setGeneralManagerCompany(project.general_manager_company || '');

      setLoadIn(project.show_dates?.load_in || '');
      setTech(project.show_dates?.tech || '');
      setPreviews(project.show_dates?.previews || '');
      setOpening(project.show_dates?.opening || '');
      setClosing(project.show_dates?.closing || '');
      setLoadOut(project.show_dates?.load_out || '');

      setEnabledModules(project.enabled_modules || ['production']);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      // Build show dates object, including all fields (empty dates will be undefined to clear them)
      const showDates: ShowDates = {
        load_in: loadIn || undefined,
        tech: tech || undefined,
        previews: previews || undefined,
        opening: opening || undefined,
        closing: closing || undefined,
        load_out: loadOut || undefined
      };

      // Build updates object - always include all fields so we can clear them
      const updates: Partial<Project> = {
        name: name.trim(),
        description: description.trim() || null,
        logo_path: logoPath || null,
        venue: venue.trim() || null,
        // Design team
        lighting_designer: lightingDesigner.trim() || null,
        lighting_designer_email: lightingDesignerEmail.trim() || null,
        lighting_designer_phone: lightingDesignerPhone.trim() || null,
        audio_designer: audioDesigner.trim() || null,
        audio_designer_email: audioDesignerEmail.trim() || null,
        audio_designer_phone: audioDesignerPhone.trim() || null,
        video_designer: videoDesigner.trim() || null,
        video_designer_email: videoDesignerEmail.trim() || null,
        video_designer_phone: videoDesignerPhone.trim() || null,
        // Production staff
        electrician: electrician.trim() || null,
        electrician_email: electricianEmail.trim() || null,
        electrician_phone: electricianPhone.trim() || null,
        audio_tech: audioTech.trim() || null,
        audio_tech_email: audioTechEmail.trim() || null,
        audio_tech_phone: audioTechPhone.trim() || null,
        video_tech: videoTech.trim() || null,
        video_tech_email: videoTechEmail.trim() || null,
        video_tech_phone: videoTechPhone.trim() || null,
        production_manager: productionManager.trim() || null,
        production_manager_email: productionManagerEmail.trim() || null,
        production_manager_phone: productionManagerPhone.trim() || null,
        production_manager_company: productionManagerCompany.trim() || null,
        general_manager: generalManager.trim() || null,
        general_manager_email: generalManagerEmail.trim() || null,
        general_manager_phone: generalManagerPhone.trim() || null,
        general_manager_company: generalManagerCompany.trim() || null,
        show_dates: showDates,
        enabled_modules: enabledModules
      };

      onSave(project.id, updates);
      onClose();
    }
  };

  const handleLogoUpload = async () => {
    if (typeof window !== 'undefined' && window.api?.dialog) {
      const filePath = await window.api.dialog.openImage();
      if (filePath) {
        setLogoPath(filePath);
      }
    } else {
      console.warn('Dialog API not available');
    }
  };

  const toggleModule = (module: string) => {
    if (enabledModules.includes(module)) {
      setEnabledModules(enabledModules.filter(m => m !== module));
    } else {
      setEnabledModules([...enabledModules, module]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Edit Project</h2>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Basic Information</h3>

            <div className="mb-4">
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Hamilton National Tour 2025"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="venue" className="block text-sm font-medium text-gray-300 mb-2">
                Venue
              </label>
              <input
                id="venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Richard Rodgers Theatre"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Show Logo
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  {logoPath ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logoPath && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>✓</span>
                    <span className="truncate max-w-xs">{logoPath}</span>
                    <button
                      type="button"
                      onClick={() => setLogoPath('')}
                      className="text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Design Team */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Design Team</h3>

            {/* Lighting Designer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Lighting Designer</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={lightingDesigner}
                  onChange={(e) => setLightingDesigner(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={lightingDesignerEmail}
                  onChange={(e) => setLightingDesignerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={lightingDesignerPhone}
                  onChange={(e) => setLightingDesignerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Audio Designer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Audio Designer</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={audioDesigner}
                  onChange={(e) => setAudioDesigner(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={audioDesignerEmail}
                  onChange={(e) => setAudioDesignerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={audioDesignerPhone}
                  onChange={(e) => setAudioDesignerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Video Designer */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Video Designer</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={videoDesigner}
                  onChange={(e) => setVideoDesigner(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={videoDesignerEmail}
                  onChange={(e) => setVideoDesignerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={videoDesignerPhone}
                  onChange={(e) => setVideoDesignerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>
          </div>

          {/* Production Staff */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Production Staff</h3>

            {/* Electrician */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Electrician</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={electrician}
                  onChange={(e) => setElectrician(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={electricianEmail}
                  onChange={(e) => setElectricianEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={electricianPhone}
                  onChange={(e) => setElectricianPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Audio Tech */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Audio Tech</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={audioTech}
                  onChange={(e) => setAudioTech(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={audioTechEmail}
                  onChange={(e) => setAudioTechEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={audioTechPhone}
                  onChange={(e) => setAudioTechPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Video Tech */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Video Tech</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={videoTech}
                  onChange={(e) => setVideoTech(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={videoTechEmail}
                  onChange={(e) => setVideoTechEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={videoTechPhone}
                  onChange={(e) => setVideoTechPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Production Manager */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Production Manager</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={productionManager}
                  onChange={(e) => setProductionManager(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={productionManagerCompany}
                  onChange={(e) => setProductionManagerCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Company (optional)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={productionManagerEmail}
                  onChange={(e) => setProductionManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={productionManagerPhone}
                  onChange={(e) => setProductionManagerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* General Manager */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">General Manager</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={generalManager}
                  onChange={(e) => setGeneralManager(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={generalManagerCompany}
                  onChange={(e) => setGeneralManagerCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Company (optional)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="email"
                  value={generalManagerEmail}
                  onChange={(e) => setGeneralManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  value={generalManagerPhone}
                  onChange={(e) => setGeneralManagerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Phone"
                />
              </div>
            </div>
          </div>

          {/* Show Dates */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Show Dates</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="load-in" className="block text-sm font-medium text-gray-300 mb-2">
                  Load In
                </label>
                <input
                  id="load-in"
                  type="date"
                  value={loadIn}
                  onChange={(e) => setLoadIn(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="tech" className="block text-sm font-medium text-gray-300 mb-2">
                  Tech
                </label>
                <input
                  id="tech"
                  type="date"
                  value={tech}
                  onChange={(e) => setTech(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="previews" className="block text-sm font-medium text-gray-300 mb-2">
                  Previews
                </label>
                <input
                  id="previews"
                  type="date"
                  value={previews}
                  onChange={(e) => setPreviews(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="opening" className="block text-sm font-medium text-gray-300 mb-2">
                  Opening
                </label>
                <input
                  id="opening"
                  type="date"
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="closing" className="block text-sm font-medium text-gray-300 mb-2">
                  Closing
                </label>
                <input
                  id="closing"
                  type="date"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="load-out" className="block text-sm font-medium text-gray-300 mb-2">
                  Load Out
                </label>
                <input
                  id="load-out"
                  type="date"
                  value={loadOut}
                  onChange={(e) => setLoadOut(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Module Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Enabled Modules</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-650">
                <input
                  type="checkbox"
                  checked={enabledModules.includes('design')}
                  onChange={() => toggleModule('design')}
                  disabled={true}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ShowStack:Design</span>
                    <span className="px-2 py-0.5 bg-gray-600 text-xs rounded">Locked</span>
                  </div>
                  <p className="text-xs text-gray-400">Lighting design & visualization</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-650">
                <input
                  type="checkbox"
                  checked={enabledModules.includes('production')}
                  onChange={() => toggleModule('production')}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">ShowStack:Production</div>
                  <p className="text-xs text-gray-400">Fixture management & technical planning</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-650">
                <input
                  type="checkbox"
                  checked={enabledModules.includes('manager')}
                  onChange={() => toggleModule('manager')}
                  disabled={true}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ShowStack:Manager</span>
                    <span className="px-2 py-0.5 bg-gray-600 text-xs rounded">Locked</span>
                  </div>
                  <p className="text-xs text-gray-400">Tour scheduling & logistics</p>
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
              disabled={!name.trim() || enabledModules.length === 0}
            >
              Save Changes
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
