import * as React from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  PageSection,
  Title,
  Button,
  Dropdown,
  KebabToggle,
  DropdownItem,
  Level,
  LevelItem,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { TableComposable, Tbody, Thead, Tr, Th, Td } from '@patternfly/react-table';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import { CranePipelineGroup, CranePipelineRun } from 'src/api/types/CranePipeline';
import { getPipelineGroupSourceNamespace, getPipelineRunUrl } from 'src/api/pipelineHelpers';
import { useNamespaceContext } from 'src/context/NamespaceContext';
import {
  isPipelineRunStarting,
  useDeletePipelineMutation,
  useStartPipelineRunMutation,
} from 'src/api/queries/pipelines';
import { PipelineRunStatus } from './PipelineRunStatus';
import { PipelineHistoryRow } from './PipelineHistoryRow';

// TODO confirm modals on all the destructive buttons
// TODO progress/status

// TODO features: stage, cutover, refresh secrets, delete, ???
// TODO stage only for pipelines with PVCs - disable or hide button? tooltip?

interface AppImportsBodyProps {
  pipelineGroup: CranePipelineGroup;
  deletePipelineMutation: ReturnType<typeof useDeletePipelineMutation>;
}

export const AppImportsBody: React.FunctionComponent<AppImportsBodyProps> = ({
  pipelineGroup,
  deletePipelineMutation,
}) => {
  const namespace = useNamespaceContext();
  const history = useHistory();

  // TODO is this working? does the element exist when focus is attempted? (renders when kebab opens)
  const onFocus = (id: string) => {
    const element = document.getElementById(id);
    element?.focus();
  };

  const [isAppKebabOpen, toggleAppKebabOpen] = React.useReducer((isOpen) => !isOpen, false);

  const onAppKebabSelect = () => {
    toggleAppKebabOpen();
    onFocus('toggle-id-app-kebab');
  };

  const nonPendingPipelineRuns = pipelineGroup.pipelineRuns.all.filter(
    (pipelineRun) => pipelineRun.spec.status !== 'PipelineRunPending',
  );
  const latestPipelineRun: CranePipelineRun | null = nonPendingPipelineRuns[0] || null;

  const startStageMutation = useStartPipelineRunMutation(pipelineGroup, 'stage');
  const isStageStarting = isPipelineRunStarting(pipelineGroup, startStageMutation);
  const startCutoverMutation = useStartPipelineRunMutation(pipelineGroup, 'cutover');
  const isCutoverStarting = isPipelineRunStarting(pipelineGroup, startCutoverMutation);
  const isSomePipelineRunStarting = isStageStarting || isCutoverStarting;

  return (
    <PageSection variant="light">
      <Level hasGutter className={spacing.mbMd}>
        <Title headingLevel="h3">{pipelineGroup.name}</Title>
        <LevelItem>
          {/* TODO add tooltip on disabled stage when there are no PVCs */}
          <Button
            id="start-stage-button"
            onClick={() => {
              // TODO add a confirm modal here
              startStageMutation.mutate();
            }}
            variant="primary"
            className={spacing.mrSm}
            isAriaDisabled={!pipelineGroup.pipelines.stage || isSomePipelineRunStarting}
            {...(isStageStarting
              ? {
                  spinnerAriaValueText: 'Starting',
                  spinnerAriaLabelledBy: 'start-stage-button',
                  isLoading: true,
                }
              : {})}
          >
            Stage
          </Button>
          <Button
            id="start-cutover-button"
            onClick={() => {
              // TODO add a confirm modal here
              startCutoverMutation.mutate();
            }}
            variant="primary"
            isAriaDisabled={isSomePipelineRunStarting}
            {...(isCutoverStarting
              ? {
                  spinnerAriaValueText: 'Starting',
                  spinnerAriaLabelledBy: 'start-stage-button',
                  isLoading: true,
                }
              : {})}
          >
            Cutover
          </Button>
          <Dropdown
            onSelect={onAppKebabSelect}
            toggle={<KebabToggle onToggle={toggleAppKebabOpen} id="toggle-id-app-kebab" />}
            isOpen={isAppKebabOpen}
            isPlain
            position="right"
            dropdownItems={[
              <DropdownItem
                key="app-delete"
                component="button"
                onClick={() =>
                  // TODO add a confirmation dialog!
                  deletePipelineMutation.mutate(pipelineGroup.pipelines.cutover)
                }
                isDisabled={deletePipelineMutation.isLoading}
              >
                Delete
              </DropdownItem>,
              <DropdownItem
                key="app-view-pipelies"
                component="button"
                onClick={() =>
                  history.push(`/dev-pipelines/ns/${namespace}?name=${pipelineGroup.name}`)
                }
              >
                View pipelines
              </DropdownItem>,
            ]}
          />
        </LevelItem>
      </Level>
      <TableComposable
        aria-label="Pipeline import review"
        variant="compact"
        borders={false}
        gridBreakPoint="grid"
        className={`summary-table ${spacing.mbLg}`}
      >
        <Thead>
          <Tr>
            <Th modifier="nowrap" id="source-project-heading">
              Source project
            </Th>
            <Th modifier="nowrap" id="pvc-heading">
              Persistent volume claims
            </Th>
            <Th modifier="nowrap" id="status-heading">
              Last run status
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr className={spacing.pl_0}>
            <Td
              className="pf-m-truncate"
              dataLabel="Source project"
              aria-labelledby="source-project-heading"
            >
              {getPipelineGroupSourceNamespace(pipelineGroup)}
            </Td>
            <Td
              className="pf-m-truncate"
              dataLabel="Persistent volume claims"
              aria-labelledby="pvc-heading"
            >
              {pipelineGroup.pipelines.stage?.spec.tasks.filter(
                (task) => task.taskRef?.name === 'crane-transfer-pvc',
              ).length || 0}
            </Td>
            <Td
              className="pf-m-truncate"
              dataLabel="Last run status"
              aria-labelledby="status-heading"
            >
              {latestPipelineRun ? (
                <Link to={getPipelineRunUrl(latestPipelineRun, namespace)}>
                  <PipelineRunStatus pipelineRun={latestPipelineRun} showAction />
                </Link>
              ) : (
                'Not started'
              )}
            </Td>
          </Tr>
        </Tbody>
      </TableComposable>
      <Title headingLevel="h3" className={spacing.mbMd}>
        Import pipeline history
      </Title>
      {nonPendingPipelineRuns?.length === 0 ? (
        <EmptyState variant="small">
          <Title headingLevel="h4" size="md">
            No import history yet
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
              <Th modifier="nowrap" id="started-heading">
                Started
              </Th>
              <Th modifier="nowrap" id="status-heading">
                Status
              </Th>
              <Th modifier="nowrap" id="delete-heading" />
            </Tr>
          </Thead>
          <Tbody>
            {pipelineGroup.pipelineRuns.all
              .filter((pipelineRun) => pipelineRun.spec.status !== 'PipelineRunPending')
              .map((pipelineRun) => (
                <PipelineHistoryRow key={pipelineRun.metadata?.name} pipelineRun={pipelineRun} />
              ))}
          </Tbody>
        </TableComposable>
      )}
    </PageSection>
  );
};
