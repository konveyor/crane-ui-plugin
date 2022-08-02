import * as React from 'react';
import { Title, Level, LevelItem } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import { CranePipelineGroup } from 'src/api/types/CranePipeline';
import { useDeletePipelineMutation } from 'src/api/queries/pipelines';
import { PipelineGroupActionButton } from './PipelineGroupActionButton';
import { PipelineGroupKebabMenu } from './PipelineGroupKebabMenu';

interface PipelineGroupHeaderProps {
  pipelineGroup: CranePipelineGroup;
  deletePipelineMutation: ReturnType<typeof useDeletePipelineMutation>;
}

export const PipelineGroupHeader: React.FunctionComponent<PipelineGroupHeaderProps> = ({
  pipelineGroup,
  deletePipelineMutation,
}) => {
  const hasStage = !!pipelineGroup.pipelines.stage;
  return (
    <Level hasGutter className={spacing.mbMd}>
      <Title headingLevel="h3">{pipelineGroup.name}</Title>
      <LevelItem>
        {hasStage ? (
          <PipelineGroupActionButton
            pipelineGroup={pipelineGroup}
            action="stage"
            variant="primary"
          />
        ) : null}
        <PipelineGroupActionButton
          pipelineGroup={pipelineGroup}
          action="cutover"
          variant={hasStage ? 'secondary' : 'primary'}
        />
        <PipelineGroupKebabMenu
          pipelineGroup={pipelineGroup}
          deletePipelineMutation={deletePipelineMutation}
        />
      </LevelItem>
    </Level>
  );
};
