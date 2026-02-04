/**
 * Label Visual Designer Page
 *
 * Wrapper page for the unified visual editor configured for label design.
 * Provides navigation and integration with the label printing system.
 */

import { useParams, useNavigate } from 'react-router-dom';
import LabelLayoutDesigner from '../components/shop-order/label/LabelLayoutDesigner';

export function LabelVisualDesigner() {
  const { projectId, averyCode } = useParams<{ projectId: string; averyCode: string }>();
  const navigate = useNavigate();

  if (!projectId || !averyCode) {
    // Redirect back to system docs if params missing
    navigate('/module/production/system-docs');
    return null;
  }

  const handleSave = (templateId: string) => {
    console.log('Label template saved:', templateId);
    // Navigate back to system docs after save
    navigate(`/project/${projectId}/module/production/system-docs`);
  };

  const handleCancel = () => {
    // Navigate back to system docs on cancel
    navigate(`/project/${projectId}/module/production/system-docs`);
  };

  return (
    <LabelLayoutDesigner
      projectId={projectId}
      templateCode={averyCode}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
