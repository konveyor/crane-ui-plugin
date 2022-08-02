import * as React from 'react';
import { Button, Modal, TextContent, Text, Checkbox } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useLocalStorage } from 'src/common/hooks/useLocalStorage';
import { useValidatedNamespace } from 'src/common/hooks/useValidatedNamespace';

export const ImportWizardWelcomeModal: React.FunctionComponent = () => {
  const { namespace } = useValidatedNamespace();
  const [isDisabled, setIsDisabled] = useLocalStorage('isCraneWizardWelcomeModalDisabled');
  const [isOpen, setIsOpen] = React.useState(isDisabled !== 'true');
  const onClose = () => setIsOpen(false);
  return (
    <Modal
      variant="medium"
      title="Import existing application from another cluster"
      actions={[
        <Button key="confirm" variant="primary" onClick={onClose}>
          Get started
        </Button>,
      ]}
      isOpen={isOpen}
      onClose={onClose}
    >
      <TextContent>
        <Text component="p">
          This wizard will generate OpenShift Pipelines and pre-populated PipelineRuns for importing
          an existing application on another cluster to the &quot;{namespace}&quot; project.
        </Text>
        <Text component="p">
          The Imported Applications page can be used to view status and take actions on the
          pipelines.
        </Text>
      </TextContent>
      <Checkbox
        className={spacing.mtMd}
        label="Don't show this again"
        id="show-again-checkbox"
        isChecked={isDisabled === 'true'}
        onChange={(checked: boolean) => {
          setIsDisabled(checked ? 'true' : 'false');
        }}
      />
    </Modal>
  );
};
