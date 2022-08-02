import { pipelineRunGVK } from 'src/api/queries/pipelines';
import { PipelineRunKind } from 'src/reused/pipelines-plugin/src/types';

export const appImportWizardAllNamespacesUrl = '/imported-apps/new/all-namespaces';

export const appImportWizardUrl = (namespace: string) => `/imported-apps/new/ns/${namespace}`;

export const importedAppsAllNamespacesUrl = '/imported-apps/all-namespaces';

export const importedAppsPageUrl = (namespace: string, pipelineGroupName?: string) =>
  `/imported-apps/ns/${namespace}${pipelineGroupName ? `/${pipelineGroupName}` : ''}`;

export const pipelineRunUrl = (namespace: string, pipelineRun: PipelineRunKind) => {
  const { group, version, kind } = pipelineRunGVK;
  return `/k8s/ns/${namespace}/${group}~${version}~${kind}/${pipelineRun.metadata?.name}`;
};

export const pipelinesListUrl = (namespace: string, nameFilter?: string) =>
  `/dev-pipelines/ns/${namespace}${nameFilter ? `?name=${nameFilter}` : ''}`;

export const projectDetailsAllNamespacesUrl = '/project-details/all-namespaces';

export const addPageAllNamespacesUrl = '/add/all-namespaces';
