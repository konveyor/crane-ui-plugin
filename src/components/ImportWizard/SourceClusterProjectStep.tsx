import * as React from 'react';
import { isWebUri } from 'valid-url';
import {
  TextContent,
  Popover,
  Text,
  Form,
  TextInputProps,
  FormGroupProps,
  Alert,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { ResolvedQueries, ValidatedPasswordInput, ValidatedTextInput } from '@konveyor/lib-ui';

import { ImportWizardFormContext } from './ImportWizardFormContext';
import { useConfigureSourceSecretMutation } from 'src/api/queries/secrets';
import { OAuthSecret } from 'src/api/types/Secret';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import {
  useSourceApiRootQuery,
  useValidateSourceNamespaceQuery,
} from 'src/api/queries/sourceResources';
import { areSourceCredentialsValid } from 'src/api/proxyHelpers';
import { useValidatedNamespace } from 'src/common/hooks/useValidatedNamespace';

export const SourceClusterProjectStep: React.FunctionComponent = () => {
  const { namespace } = useValidatedNamespace();
  const formContext = React.useContext(ImportWizardFormContext);
  const form = formContext.sourceClusterProject;

  const configureSourceSecretMutation = useConfigureSourceSecretMutation({
    existingSecretFromState: form.values.sourceApiSecret,
    onSuccess: (newSecret: OAuthSecret) => {
      form.fields.sourceApiSecret.setValue(newSecret);
      form.fields.apiUrl.markSaved();
      form.fields.token.markSaved();
    },
  });

  const configureSourceSecret = () => {
    const { apiUrl, token } = form.fields;
    if ((apiUrl.isDirty || token.isDirty) && apiUrl.value && token.value && isApiUrlValidFormat) {
      configureSourceSecretMutation.mutate({ apiUrl: apiUrl.value, token: token.value });
    }
  };

  const sourceApiRootQuery = useSourceApiRootQuery(
    form.values.sourceApiSecret,
    !configureSourceSecretMutation.isLoading,
  );

  const isApiUrlValidFormat = !!isWebUri(form.fields.apiUrl.value);
  const credentialsValidating =
    isApiUrlValidFormat &&
    (configureSourceSecretMutation.isLoading || sourceApiRootQuery.isLoading);

  const credentialsAreValid = areSourceCredentialsValid(
    form.fields.apiUrl,
    form.fields.token,
    form.fields.sourceApiSecret,
    sourceApiRootQuery,
  );

  const validateSourceNamespaceQuery = useValidateSourceNamespaceQuery(
    form.values.sourceApiSecret,
    form.values.sourceNamespace,
    form.fields.sourceNamespace.isTouched,
  );

  // Override validation styles based on connection check.
  // Can't use greenWhenValid prop of ValidatedTextInput because fields can be valid before connection test passes.
  // This way we don't show the connection failed message when you just haven't finished entering credentials.
  // The `validated: 'error'` case is handled in ValidatedTextInput based on the field schema.
  type validationFieldPropsType = {
    validating: boolean;
    valid: boolean;
    helperText?: React.ReactNode;
    labelIcon?: React.ReactElement;
  };
  const getAsyncValidationFieldProps = ({
    valid,
    validating,
    helperText,
    labelIcon,
  }: validationFieldPropsType) => {
    const inputProps: Pick<TextInputProps, 'validated'> = {
      ...(validating ? { validated: 'default' } : {}),
      ...(valid ? { validated: 'success' } : {}),
    };
    const formGroupProps: Pick<FormGroupProps, 'validated' | 'helperText' | 'labelIcon'> = {
      ...inputProps,
      helperText: validating ? 'Validating...' : helperText,
      labelIcon: labelIcon,
    };
    return { inputProps, formGroupProps };
  };

  const apiUrlFieldProps = getAsyncValidationFieldProps({
    validating: credentialsValidating,
    valid: credentialsAreValid,
    labelIcon: (
      <Popover
        headerContent={`API URL of the source cluster`}
        bodyContent={
          <span>
            e.g. <code>https://api.example.cluster:6443</code>
          </span>
        }
      >
        <button
          type="button"
          aria-label="More info for api url field"
          onClick={(e) => e.preventDefault()}
          aria-describedby="api-url"
          className="pf-c-form__group-label-help"
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ),
    helperText: <>&nbsp;</>,
  });

  const sourceTokenFieldProps = getAsyncValidationFieldProps({
    validating: credentialsValidating,
    valid: credentialsAreValid,
    labelIcon: (
      <Popover
        headerContent={`OAuth token of the source cluster`}
        bodyContent={
          <span>
            Can be found via <code>oc whoami -t</code>
          </span>
        }
      >
        <button
          type="button"
          aria-label="More info for oauth token field"
          onClick={(e) => e.preventDefault()}
          aria-describedby="token"
          className="pf-c-form__group-label-help"
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ),
    helperText: <>&nbsp;</>,
  });

  const sourceNamespaceFieldProps = getAsyncValidationFieldProps({
    validating: validateSourceNamespaceQuery.isLoading,
    valid: form.fields.sourceNamespace.isValid,
    labelIcon: (
      <Popover
        headerContent={`Name of the project to be imported`}
        bodyContent={
          <span>
            Can be found via <code>oc project</code>
          </span>
        }
      >
        <button
          type="button"
          aria-label="More info for project name field"
          onClick={(e) => e.preventDefault()}
          aria-describedby="project-name"
          className="pf-c-form__group-label-help"
        >
          <HelpIcon noVerticalAlign />
        </button>
      </Popover>
    ),
  });

  return (
    <>
      <TextContent className={spacing.mbMd}>
        <Text component="h2">Source cluster and project</Text>
      </TextContent>
      <Form isWidthLimited>
        <ValidatedTextInput
          field={form.fields.apiUrl}
          isRequired
          fieldId="api-url"
          onBlur={configureSourceSecret}
          {...apiUrlFieldProps}
        />
        <ValidatedPasswordInput
          field={form.fields.token}
          isRequired
          fieldId="token"
          onBlur={configureSourceSecret}
          {...sourceTokenFieldProps}
        />
        <ValidatedTextInput
          field={form.fields.sourceNamespace}
          isRequired
          fieldId="project-name"
          onChange={() => form.fields.sourceNamespace.setIsTouched(false)} // So we can use isTouched to enable/disable the validation query
          // isTouched is already automatically set to true on blur
          {...sourceNamespaceFieldProps}
        />
        {isApiUrlValidFormat ? (
          <ResolvedQueries
            spinnerMode="none"
            resultsWithErrorTitles={[
              {
                result: configureSourceSecretMutation,
                errorTitle: 'Cannot configure crane-reverse-proxy',
              },
              { result: sourceApiRootQuery, errorTitle: 'Cannot load cluster API versions' },
            ]}
          />
        ) : null}
      </Form>
      {form.isValid ? (
        <Alert
          className={spacing.mtXl}
          variant="info"
          isInline
          isLiveRegion
          title={`If you proceed, your current session's OAuth token will be stored in a secret in the ${namespace} namespace.`}
        >
          This allows the import pipeline tasks to be performed with the required permissions.
        </Alert>
      ) : null}
    </>
  );
};
