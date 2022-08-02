import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import { getPipelineGroupSourceNamespace } from 'src/api/pipelineHelpers';
import { CranePipelineGroup } from 'src/api/types/CranePipeline';
import { pipelineRunUrl } from 'src/utils/paths';
import { PipelineRunStatus } from './PipelineRunStatus';
import { useValidatedNamespace } from 'src/common/hooks/useValidatedNamespace';

interface PipelineGroupSummaryProps {
  pipelineGroup: CranePipelineGroup;
}

export const PipelineGroupSummary: React.FunctionComponent<PipelineGroupSummaryProps> = ({
  pipelineGroup,
}) => {
  const { namespace } = useValidatedNamespace();
  const latestPipelineRun = pipelineGroup.pipelineRuns.latestNonPending;
  return (
    <DescriptionList
      isHorizontal
      horizontalTermWidthModifier={{ default: '30ch' }}
      className={`${spacing.mtXl} ${spacing.mb_2xl}`}
    >
      <DescriptionListGroup>
        <DescriptionListTerm>Source project</DescriptionListTerm>
        <DescriptionListDescription>
          {getPipelineGroupSourceNamespace(pipelineGroup)}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Persistent volume claims</DescriptionListTerm>
        <DescriptionListDescription>
          {pipelineGroup.pipelines.stage?.spec.tasks.filter(
            (task) => task.taskRef?.name === 'crane-transfer-pvc',
          ).length || 0}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Last run status</DescriptionListTerm>
        <DescriptionListDescription>
          {latestPipelineRun ? (
            <Link to={pipelineRunUrl(namespace, latestPipelineRun)}>
              <PipelineRunStatus pipelineRun={latestPipelineRun} showAction />
            </Link>
          ) : (
            'Not yet attempted'
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
