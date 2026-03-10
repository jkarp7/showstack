/**
 * Label Visual Designer Page
 *
 * Wrapper page for the unified visual editor configured for label design.
 * Provides navigation and integration with the label printing system.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import LabelLayoutDesigner from '../components/shop-order/label/LabelLayoutDesigner';

export function LabelVisualDesigner() {
  const { projectId, averyCode } = useParams<{ projectId: string; averyCode: string }>();
  const navigate = useNavigate();

  if (!projectId || !averyCode) {
    navigate('/');
    return null;
  }

  const handleSave = (templateId: string) => {
    logger.info('Label template saved:', templateId);
    navigate(`/project/${projectId}/labels`);
  };

  const handleCancel = () => {
    navigate(`/project/${projectId}/labels`);
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
