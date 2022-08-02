import * as React from 'react';
import { StatusComponent } from '@openshift-console/dynamic-plugin-sdk';
import { pipelineRunStatus } from 'src/reused/pipelines-plugin/src/utils/pipeline-filter-reducer';
import { CranePipelineRun } from 'src/api/types/CranePipeline';
import { resourceActionToString } from 'src/api/pipelineHelpers';

interface PipelineRunStatusProps {
  pipelineRun: CranePipelineRun;
  showAction?: boolean;
}

export const PipelineRunStatus: React.FunctionComponent<PipelineRunStatusProps> = ({
  pipelineRun,
  showAction = false,
}) => {
  const action = resourceActionToString(pipelineRun, true);
  return (
    <StatusComponent
      status={pipelineRunStatus(pipelineRun) || ''}
      title={`${pipelineRunStatus(pipelineRun) || ''}${showAction ? ` ${action}` : ''}`}
    />
  );
};
