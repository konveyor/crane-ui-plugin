import * as React from 'react';
import { Button, ButtonProps, Tooltip } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import {
  useStartPipelineRunMutation,
  isPipelineRunStarting,
  isMissingPipelineRuns,
  isSomePipelineRunning,
  hasRunWithStatus,
} from 'src/api/queries/pipelines';
import { CranePipelineAction, CranePipelineGroup } from 'src/api/types/CranePipeline';
import { actionToString } from 'src/api/pipelineHelpers';
import { ConfirmModal } from 'src/common/components/ConfirmModal';
import { PipelineExplanation } from 'src/common/components/PipelineExplanation';

interface PipelineGroupActionButtonProps {
  pipelineGroup: CranePipelineGroup;
  action: CranePipelineAction;
  variant?: ButtonProps['variant'];
}

export const PipelineGroupActionButton: React.FunctionComponent<PipelineGroupActionButtonProps> = ({
  pipelineGroup,
  action,
  variant = 'secondary',
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);

  const mutation = useStartPipelineRunMutation(pipelineGroup, action, {
    onSuccess: () => setIsConfirmModalOpen(false),
  });
  const isStarting = isPipelineRunStarting(pipelineGroup, mutation);
  const isGroupBroken = isMissingPipelineRuns(pipelineGroup);
  const isRunning = isSomePipelineRunning(pipelineGroup);
  const isPastCutover = hasRunWithStatus(pipelineGroup, 'cutover', 'Succeeded');
  const isDisabled = isStarting || isGroupBroken || isRunning || isPastCutover;

  React.useEffect(() => {
    // Don't keep old mutation state around in case relevant resources get deleted and mess with isStarting
    if (!isStarting && mutation.isSuccess) mutation.reset();
  }, [isStarting, mutation]);

  const button = (
    <Button
      id={`start-${action}-button`}
      onClick={() => setIsConfirmModalOpen(true)}
      variant={variant}
      className={spacing.mlSm}
      isAriaDisabled={isDisabled}
      {...(isStarting
        ? {
            spinnerAriaValueText: 'Starting',
            spinnerAriaLabelledBy: `start-${action}-button`,
            isLoading: true,
          }
        : {})}
    >
      {actionToString(action)}
    </Button>
  );

  const disabledReason = isGroupBroken ? (
    <>
      This application cannot be imported because pre-generated PipelineRuns have been deleted.
      Delete the import and start a new one.
    </>
  ) : isRunning ? (
    <>A stage or cutover cannot be started while one is already running.</>
  ) : isPastCutover ? (
    <>A stage or cutover cannot be run after a cutover is already succeeded.</>
  ) : null;

  return (
    <>
      {disabledReason ? <Tooltip content={disabledReason}>{button}</Tooltip> : button}
      <ConfirmModal
        title={`Run ${action}?`}
        body={
          <PipelineExplanation
            action={action}
            isStatefulMigration={pipelineGroup.isStatefulMigration}
          />
        }
        confirmButtonText={actionToString(action)}
        isOpen={isConfirmModalOpen}
        toggleOpen={() => setIsConfirmModalOpen(!isConfirmModalOpen)}
        mutateFn={mutation.mutate}
        mutateResult={mutation}
        errorText={`Cannot start ${action} PipelineRun`}
      />
    </>
  );
};
