import * as React from 'react';
import Helmet from 'react-helmet';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';
import {
  Page,
  PageSection,
  Title,
  TextContent,
  Text,
  Level,
  Button,
  Tab,
  Tabs,
  TabTitleText,
  Alert,
  EmptyState,
  EmptyStateIcon,
  Divider,
  AlertActionLink,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import {
  isMissingPipelineRuns,
  useDeletePipelineMutation,
  useWatchCranePipelineGroups,
} from 'src/api/queries/pipelines';
import { watchErrorToString } from 'src/utils/helpers';
import {
  importedAppsAllNamespacesUrl,
  importedAppsPageUrl,
  appImportWizardUrl,
  projectDetailsAllNamespacesUrl,
} from 'src/utils/paths';

import { PipelineGroupHeader } from './ImportedApps/PipelineGroupHeader';
import { PipelineGroupSummary } from './ImportedApps/PipelineGroupSummary';
import { PipelineGroupHistoryTable } from './ImportedApps/PipelineGroupHistoryTable';
import { NoProjectEmptyState } from 'src/common/components/NoProjectEmptyState';
import { LoadingEmptyState } from 'src/common/components/LoadingEmptyState';
import {
  useValidatedNamespace,
  useRedirectOnInvalidNamespaceEffect,
} from 'src/common/hooks/useValidatedNamespace';

const queryClient = new QueryClient();

const ImportedAppsPageWrapper: React.FunctionComponent = () => {
  const {
    params: { pipelineGroupName: activePipelineGroupName },
  } = useRouteMatch<{ pipelineGroupName: string }>();
  return (
    <>
      <Helmet>
        <title>Imported Applications</title>
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <ImportedAppsPage activePipelineGroupName={activePipelineGroupName} />
      </QueryClientProvider>
    </>
  );
};

interface ImportedAppsPageProps {
  activePipelineGroupName: string;
}

const ImportedAppsPage: React.FunctionComponent<ImportedAppsPageProps> = ({
  activePipelineGroupName,
}) => {
  const history = useHistory();
  const { pipelineGroups, loaded: pipelineGroupsLoaded, error } = useWatchCranePipelineGroups();
  const { namespace, isValidatingNamespace, isAllNamespaces } = useValidatedNamespace();
  useRedirectOnInvalidNamespaceEffect(importedAppsAllNamespacesUrl);

  const isLoaded = pipelineGroupsLoaded && !isValidatingNamespace;

  const setActivePipelineGroupName = React.useCallback(
    (name: string, op: 'push' | 'replace' = 'push') =>
      history[op](importedAppsPageUrl(namespace, name)),
    [history, namespace],
  );

  // If pipeline groups are loaded and we don't have one selected, or we have one selected that doesn't exist, select the first one
  React.useEffect(() => {
    if (
      isLoaded &&
      !isAllNamespaces &&
      pipelineGroups.length > 0 &&
      (!activePipelineGroupName ||
        !pipelineGroups.find(({ name }) => name === activePipelineGroupName))
    ) {
      setActivePipelineGroupName(pipelineGroups[0].name, 'replace');
    }
  }, [
    isLoaded,
    isAllNamespaces,
    pipelineGroups,
    activePipelineGroupName,
    setActivePipelineGroupName,
  ]);

  const areTabsVisible = pipelineGroups.length > 1;
  const activePipelineGroup = pipelineGroups.find(({ name }) => name === activePipelineGroupName);

  const deletePipelineMutation = useDeletePipelineMutation();

  // The onSuccess of deletePipelineMutation is not enough to know the data is gone, we have to wait for useWatchCranePipelineGroups to catch up.
  // If we just deleted the current group and it no longer exists in the watched groups, reset the deletion state and navigate away from the deleted group's route.
  React.useEffect(() => {
    const groupBeingDeletedName =
      deletePipelineMutation.variables?.metadata.annotations?.['crane-ui-plugin.konveyor.io/group'];
    if (
      deletePipelineMutation.isSuccess &&
      groupBeingDeletedName === activePipelineGroupName &&
      !activePipelineGroup
    ) {
      deletePipelineMutation.reset();
      history.replace(importedAppsPageUrl(namespace));
    }
  }, [activePipelineGroupName, activePipelineGroup, deletePipelineMutation, history, namespace]);

  const isEmptyState = isLoaded && pipelineGroups.length === 0;
  const goToImportWizard = () => history.push(appImportWizardUrl(namespace));

  return (
    <Page>
      <PageSection variant="light">
        <Level>
          <TextContent>
            <Title headingLevel="h1">Imported Applications</Title>
            <Text>View status and take actions on your pipeline groups.</Text>
          </TextContent>
          {!isAllNamespaces && !isEmptyState ? (
            <Button variant="secondary" className={spacing.mxMd} onClick={goToImportWizard}>
              Start a new import
            </Button>
          ) : null}
        </Level>
      </PageSection>
      {isAllNamespaces ? (
        <NoProjectEmptyState selectProjectHref={projectDetailsAllNamespacesUrl} />
      ) : error ? (
        <Alert
          variant="danger"
          title="Cannot load Pipelines and PipelineRuns"
          className={spacing.mLg}
        >
          {watchErrorToString(error)}
        </Alert>
      ) : isEmptyState ? (
        <EmptyState variant="large" className={spacing.mtXl}>
          <EmptyStateIcon icon={PlusCircleIcon} />
          <Title headingLevel="h4" size="lg">
            No imported applications yet
          </Title>
          <Button variant="primary" onClick={goToImportWizard}>
            Start a new import
          </Button>
        </EmptyState>
      ) : !isLoaded || !activePipelineGroup || !deletePipelineMutation.isIdle ? (
        <LoadingEmptyState />
      ) : (
        <>
          {areTabsVisible ? (
            <PageSection variant="light" type="tabs" className={spacing.pt_0}>
              <Tabs
                activeKey={activePipelineGroupName}
                onSelect={(_event, tabKey) => setActivePipelineGroupName(tabKey as string)}
                className={spacing.pxLg}
              >
                {pipelineGroups.map((group) => (
                  <Tab
                    key={group.name}
                    eventKey={group.name}
                    title={<TabTitleText>{group.name}</TabTitleText>}
                  />
                ))}
              </Tabs>
            </PageSection>
          ) : (
            <Divider />
          )}
          <PageSection variant="light">
            <PipelineGroupHeader
              pipelineGroup={activePipelineGroup}
              deletePipelineMutation={deletePipelineMutation}
            />
            {isMissingPipelineRuns(activePipelineGroup) ? (
              <Alert
                variant="warning"
                isInline
                title="Missing PipelineRuns"
                actionLinks={
                  <AlertActionLink
                    onClick={() =>
                      deletePipelineMutation.mutate(activePipelineGroup.pipelines.cutover)
                    }
                  >
                    Delete remaining Pipelines and PipelineRuns for this import
                  </AlertActionLink>
                }
                className={spacing.mbLg}
              >
                This application cannot be imported because pre-generated PipelineRuns have been
                deleted. Delete the import and start a new one.
              </Alert>
            ) : (
              <PipelineGroupSummary pipelineGroup={activePipelineGroup} />
            )}
            <PipelineGroupHistoryTable pipelineGroup={activePipelineGroup} />
          </PageSection>
        </>
      )}
    </Page>
  );
};

export default ImportedAppsPageWrapper;
