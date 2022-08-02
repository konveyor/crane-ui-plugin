import * as React from 'react';
import * as yup from 'yup';
import { isWebUri } from 'valid-url';
import { useFormField, useFormState } from '@konveyor/lib-ui';
import { OAuthSecret } from 'src/api/types/Secret';
import { PersistentVolumeClaim } from 'src/api/types/PersistentVolume';
import { getCapacity } from 'src/utils/helpers';
import {
  capacitySchema,
  dnsLabelNameSchema,
  getPipelineGroupNameSchema,
  getSourceNamespaceSchema,
  getTargetPVCNameSchema,
  yamlSchema,
} from 'src/common/schema';
import { areSourceCredentialsValid } from 'src/api/proxyHelpers';
import { secretMatchesCredentials } from 'src/api/queries/secrets';
import { useWatchPipelines } from 'src/api/queries/pipelines';
import {
  useSourceApiRootQuery,
  useValidateSourceNamespaceQuery,
} from 'src/api/queries/sourceResources';
import { isDefaultStorageClass, useWatchStorageClasses } from 'src/api/queries/storageClasses';
import { useWatchPVCs } from 'src/api/queries/pvcs';

export const useImportWizardFormState = () => {
  // Some form field state objects are lifted out of the useFormState calls so they can reference each other
  const sourceApiSecretField = useFormField<OAuthSecret | null>(null, yup.mixed());

  const credentialsFieldSchema = yup
    .string()
    .required()
    .test('is-not-validating', (_value, context) => {
      if (sourceApiRootQuery.isLoading) {
        return context.createError();
      }
      return true;
    })
    .test('loads-namespaces', (_value, context) => {
      if (
        sourceApiSecretField.value &&
        secretMatchesCredentials(sourceApiSecretField.value, apiUrlField.value, tokenField.value) &&
        !credentialsAreValid
      ) {
        return context.createError({ message: 'Cannot connect using these credentials' });
      }
      return true;
    });
  const apiUrlSchema = credentialsFieldSchema.test(
    'valid-url',
    ({ label }) => `${label} must be a valid URL`,
    (value) => !!value && !!isWebUri(value),
  );

  const resetSourceSelections = () => {
    // If the source cluster/project is changing, reset everything the user has selected based on data from the source.
    forms.pvcSelect.clear();
    forms.pvcEdit.clear();
  };

  const apiUrlField = useFormField('', apiUrlSchema.label('Cluster API URL'), {
    onChange: resetSourceSelections,
  });
  const tokenField = useFormField('', credentialsFieldSchema.label('OAuth token'), {
    onChange: resetSourceSelections,
  });

  const sourceApiRootQuery = useSourceApiRootQuery(sourceApiSecretField.value);
  const credentialsAreValid = areSourceCredentialsValid(
    apiUrlField,
    tokenField,
    sourceApiSecretField,
    sourceApiRootQuery,
  );

  const storageClassesWatch = useWatchStorageClasses();

  const isEditModeByPVCField = useFormField<PVIsEditModeByPVCName>(
    {},
    yup.mixed<PVIsEditModeByPVCName>(),
  );
  const editValuesByPVCField = useFormField<PVCEditValuesByPVCName>(
    {},
    yup.mixed<PVCEditValuesByPVCName>().required(),
  );

  // When selected PVs change, initialize the per-PV form values for the Edit PVs step
  const onSelectedPVCsChange = (selectedPVCs: PersistentVolumeClaim[]) => {
    const defaultIsEditModeByPVC: PVIsEditModeByPVCName = {};
    const defaultEditValuesByPVC: PVCEditValuesByPVCName = {};
    const defaultStorageClass = storageClassesWatch.data?.find(isDefaultStorageClass);
    selectedPVCs.forEach((pvc) => {
      if (pvc.metadata?.name) {
        defaultIsEditModeByPVC[pvc.metadata.name] = false;
        const defaultEditValues: PVCEditRowFormValues = {
          targetPvcName: pvc.metadata.name,
          storageClass: defaultStorageClass?.metadata.name || '',
          capacity: getCapacity(pvc),
          verifyCopy: false,
        };
        defaultEditValuesByPVC[pvc.metadata.name] =
          editValuesByPVCField.value[pvc.metadata.name] || defaultEditValues;
      }
    });
    isEditModeByPVCField.reinitialize(defaultIsEditModeByPVC);
    editValuesByPVCField.reinitialize(defaultEditValuesByPVC);
  };

  const sourceNamespaceField = useFormField('', yup.string(), {
    onChange: resetSourceSelections,
  }); // Temporary schema reassigned below
  const validateSourceNamespaceQuery = useValidateSourceNamespaceQuery(
    sourceApiSecretField.value,
    sourceNamespaceField.value,
    sourceNamespaceField.isTouched,
  );
  sourceNamespaceField.schema = getSourceNamespaceSchema(
    validateSourceNamespaceQuery,
    credentialsAreValid,
  ).label('Project name');

  const selectedPVCsField = useFormField<PersistentVolumeClaim[]>([], yup.array(), {
    onChange: onSelectedPVCsChange,
  });

  const isStatefulMigration = selectedPVCsField.value.length > 0;
  const hasMultiplePipelines = isStatefulMigration;

  const pipelineGroupNameField = useFormField(
    '',
    getPipelineGroupNameSchema(useWatchPipelines(), isStatefulMigration).label(
      hasMultiplePipelines ? 'Pipeline group name' : 'Pipeline name',
    ),
  );

  const stagePipelineName = `${pipelineGroupNameField.value}-stage`;
  const cutoverPipelineName = hasMultiplePipelines
    ? `${pipelineGroupNameField.value}-cutover`
    : pipelineGroupNameField.value;

  const forms = {
    sourceClusterProject: useFormState(
      {
        apiUrl: apiUrlField,
        token: tokenField,
        sourceNamespace: sourceNamespaceField,
        sourceApiSecret: sourceApiSecretField,
      },
      {
        revalidateOnChange: [credentialsAreValid, validateSourceNamespaceQuery.data],
      },
    ),
    pvcSelect: useFormState({
      selectedPVCs: selectedPVCsField,
    }),
    pvcEdit: useFormState({
      isEditModeByPVC: isEditModeByPVCField,
      editValuesByPVC: editValuesByPVCField,
    }),
    pipelineSettings: useFormState({
      pipelineGroupName: pipelineGroupNameField,
    }),
    review: useFormState({
      destinationApiSecret: useFormField<OAuthSecret | null>(null, yup.mixed()),
      stagePipelineYaml: useFormField('', yamlSchema.label(`Pipeline (${stagePipelineName})`)),
      stagePipelineRunYaml: useFormField(
        '',
        yamlSchema.label(`PipelineRun (${stagePipelineName})`),
      ),
      cutoverPipelineYaml: useFormField(
        '',
        yamlSchema.label(`Pipeline (${cutoverPipelineName})`).required(),
      ),
      cutoverPipelineRunYaml: useFormField(
        '',
        yamlSchema.label(`PipelineRun (${cutoverPipelineName})`).required(),
      ),
    }),
  };

  return {
    ...forms,
    isSomeFormDirty: Object.values(forms).some((form) => form.isDirty),
  };
};

export type ImportWizardFormState = ReturnType<typeof useImportWizardFormState>;

export const ImportWizardFormContext = React.createContext<ImportWizardFormState>(
  {} as ImportWizardFormState,
);

export interface PVCEditRowFormValues {
  targetPvcName: string;
  storageClass: string;
  capacity: string;
  verifyCopy: boolean;
}

export const usePVCEditRowFormState = (existingValues: PVCEditRowFormValues) => {
  const { targetPvcName, storageClass, capacity, verifyCopy } = existingValues;
  return useFormState<PVCEditRowFormValues>({
    targetPvcName: useFormField(targetPvcName, getTargetPVCNameSchema(useWatchPVCs())),
    storageClass: useFormField(storageClass, dnsLabelNameSchema.label('Storage class').required()),
    capacity: useFormField(capacity, capacitySchema.label('Capacity').required()),
    verifyCopy: useFormField(verifyCopy, yup.boolean().label('Verify copy').required()),
  });
};

export type PVCEditValuesByPVCName = Record<string, PVCEditRowFormValues>;
export type PVIsEditModeByPVCName = Record<string, boolean>;
