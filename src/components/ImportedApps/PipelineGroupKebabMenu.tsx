import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Dropdown, KebabToggle, DropdownItem, Tooltip } from '@patternfly/react-core';

import { CranePipelineGroup } from 'src/api/types/CranePipeline';
import { isSomePipelineRunning, useDeletePipelineMutation } from 'src/api/queries/pipelines';
import { pipelinesListUrl } from 'src/utils/paths';
import { ConfirmModal } from 'src/common/components/ConfirmModal';
import { useValidatedNamespace } from 'src/common/hooks/useValidatedNamespace';

interface PipelineGroupKebabMenuProps {
  pipelineGroup: CranePipelineGroup;
  deletePipelineMutation: ReturnType<typeof useDeletePipelineMutation>;
}

export const PipelineGroupKebabMenu: React.FunctionComponent<PipelineGroupKebabMenuProps> = ({
  pipelineGroup,
  deletePipelineMutation,
}) => {
  const { namespace } = useValidatedNamespace();
  const history = useHistory();

  const onFocus = (id: string) => {
    const element = document.getElementById(id);
    element?.focus();
  };

  const [isAppKebabOpen, toggleAppKebabOpen] = React.useReducer((isOpen) => !isOpen, false);

  const onAppKebabSelect = () => {
    toggleAppKebabOpen();
    onFocus('toggle-id-app-kebab');
  };

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = React.useState(false);
  const isRunning = isSomePipelineRunning(pipelineGroup);
  const deleteItem = (
    <DropdownItem
      key="app-delete"
      component="button"
      onClick={() => setIsConfirmDeleteModalOpen(true)}
      isAriaDisabled={deletePipelineMutation.isLoading || isRunning}
    >
      Delete
    </DropdownItem>
  );

  return (
    <>
      <Dropdown
        onSelect={onAppKebabSelect}
        toggle={<KebabToggle onToggle={toggleAppKebabOpen} id="toggle-id-app-kebab" />}
        isOpen={isAppKebabOpen}
        isPlain
        position="right"
        dropdownItems={[
          isRunning ? (
            <Tooltip content="The import pipelines cannot be deleted while one is running.">
              {deleteItem}
            </Tooltip>
          ) : (
            deleteItem
          ),
          <DropdownItem
            key="app-view-pipelies"
            component="button"
            onClick={() => history.push(pipelinesListUrl(namespace, pipelineGroup.name))}
          >
            View pipelines
          </DropdownItem>,
        ]}
      />
      <ConfirmModal
        title="Delete pipelines and history?"
        body={
          <>
            This will delete all Pipelines, PipelineRuns and Secrets that were created with the
            group name <strong>&quot;{pipelineGroup.name}&quot;</strong>. All related logs and
            history will be lost.
          </>
        }
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        isOpen={isConfirmDeleteModalOpen}
        toggleOpen={() => setIsConfirmDeleteModalOpen(!isConfirmDeleteModalOpen)}
        mutateFn={() => deletePipelineMutation.mutate(pipelineGroup.pipelines.cutover)}
        mutateResult={deletePipelineMutation}
        errorText="Cannot delete resources"
      />
    </>
  );
};
