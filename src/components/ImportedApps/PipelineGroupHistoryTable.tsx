import * as React from 'react';
import { Link } from 'react-router-dom';
import { Title, EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { TableComposable, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';

import { useValidatedNamespace } from 'src/common/hooks/useValidatedNamespace';
import { CranePipelineGroup } from 'src/api/types/CranePipeline';
import { resourceActionToString } from 'src/api/pipelineHelpers';
import { pipelineRunUrl } from 'src/utils/paths';
import { PipelineRunStatus } from './PipelineRunStatus';

interface PipelineGroupHistoryTableProps {
  pipelineGroup: CranePipelineGroup;
}

export const PipelineGroupHistoryTable: React.FunctionComponent<PipelineGroupHistoryTableProps> = ({
  pipelineGroup,
}) => {
  const { namespace } = useValidatedNamespace();
  return (
    <>
      <Title headingLevel="h3" className={spacing.mbMd}>
        History
      </Title>
      {pipelineGroup.pipelineRuns.nonPending.length === 0 ? (
        <EmptyState variant="small">
          <Title headingLevel="h4" size="md">
            No history yet
          </Title>
          <EmptyStateBody>Stage and Cutover PipelineRun history will appear here.</EmptyStateBody>
        </EmptyState>
      ) : (
        <TableComposable aria-label="Pipeline history" variant="compact">
          <Thead>
            <Tr>
              <Th modifier="nowrap" id="pipeline-run-heading">
                Pipeline run
              </Th>
              <Th modifier="nowrap" id="action-heading">
                Action
              </Th>
              <Th modifier="nowrap" id="started-heading">
                Started
              </Th>
              <Th modifier="nowrap" id="status-heading">
                Status
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {pipelineGroup.pipelineRuns.nonPending.map((pipelineRun) => (
              <Tr key={`${pipelineRun.metadata?.name}`}>
                <Td
                  className="pf-m-truncate"
                  dataLabel="Pipeline run"
                  aria-labelledby="pipeline-run-heading"
                >
                  <Link to={pipelineRunUrl(namespace, pipelineRun)}>
                    {pipelineRun.metadata?.name}
                  </Link>
                </Td>
                <Td className="pf-m-truncate" dataLabel="Action" aria-labelledby="action-heading">
                  {resourceActionToString(pipelineRun)}
                </Td>
                <Td className="pf-m-truncate" dataLabel="Started" aria-labelledby="started-heading">
                  {pipelineRun.status?.startTime ? (
                    <Timestamp timestamp={pipelineRun.status?.startTime} />
                  ) : (
                    'Starting...'
                  )}
                </Td>
                <Td className="pf-m-truncate" dataLabel="Status" aria-labelledby="result-heading">
                  <Link to={pipelineRunUrl(namespace, pipelineRun)}>
                    <PipelineRunStatus pipelineRun={pipelineRun} />
                  </Link>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      )}
    </>
  );
};
