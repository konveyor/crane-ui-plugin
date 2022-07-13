import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { Tr, Td } from '@patternfly/react-table';
import alignment from '@patternfly/react-styles/css/utilities/Alignment/alignment';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';

import { getPipelineRunUrl } from 'src/api/pipelineHelpers';
import { CranePipelineRun } from 'src/api/types/CranePipeline';
import { PipelineRunStatus } from './PipelineRunStatus';
import { useNamespaceContext } from 'src/context/NamespaceContext';
import { useDeletePipelineRunMutation } from 'src/api/queries/pipelines';

interface PipelineHistoryRowProps {
  pipelineRun: CranePipelineRun;
}

export const PipelineHistoryRow: React.FunctionComponent<PipelineHistoryRowProps> = ({
  pipelineRun,
}) => {
  const namespace = useNamespaceContext();
  const deletePipelineRunMutation = useDeletePipelineRunMutation();

  // !isIdle is enough to know whether it's still deleting since once the PLR is removed from watched data, this component will unmount
  const isDeleting = !deletePipelineRunMutation.isIdle;

  return (
    <Tr key={`${pipelineRun.metadata?.name}`}>
      <Td className="pf-m-truncate" dataLabel="Pipeline run" aria-labelledby="pipeline-run-heading">
        <Link to={getPipelineRunUrl(pipelineRun, namespace)}>{pipelineRun.metadata?.name}</Link>
      </Td>
      <Td className="pf-m-truncate" dataLabel="Started" aria-labelledby="started-heading">
        {pipelineRun.status?.startTime ? (
          <Timestamp timestamp={pipelineRun.status?.startTime} />
        ) : (
          'Not started'
        )}
      </Td>
      <Td className="pf-m-truncate" dataLabel="Status" aria-labelledby="result-heading">
        <Link to={getPipelineRunUrl(pipelineRun, namespace)}>
          <PipelineRunStatus pipelineRun={pipelineRun} />
        </Link>
      </Td>
      <Td className={alignment.textAlignRight} dataLabel="" aria-labelledby="delete-heading">
        <Button
          id={`delete-pipelinerun-button-${pipelineRun.metadata?.name}`}
          variant="secondary"
          onClick={() => {
            // TODO confirm modal here
            deletePipelineRunMutation.mutate(pipelineRun);
          }}
          isDisabled={isDeleting}
          {...(isDeleting
            ? {
                spinnerAriaValueText: 'Deleting',
                spinnerAriaLabelledBy: `delete-pipelinerun-button-${pipelineRun.metadata?.name}`,
                isLoading: true,
              }
            : {})}
        >
          Delete
        </Button>
      </Td>
    </Tr>
  );
};
