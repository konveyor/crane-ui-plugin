import * as React from 'react';
import {
  DropdownToggle,
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Title,
  Grid,
  GridItem,
  Button,
  Dropdown,
  KebabToggle,
  DropdownItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { TableComposable, Tbody, Thead, Tr, Th, Td } from '@patternfly/react-table';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import CaretDownIcon from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import { useWatchPipelines } from 'src/api/queries/pipelines';

export const AppImports: React.FunctionComponent = () => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  const pipelines = useWatchPipelines();

  const handleTabClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number,
  ) => {
    setActiveTabKey(eventKey);
  };

  const onFocus = (id: string) => {
    const element = document.getElementById(id);
    element?.focus();
  };

  const [isAppKebabOpen, toggleAppKebabOpen] = React.useReducer((isOpen) => !isOpen, false);
  const [isFilter1KebabOpen, toggleFilter1KebabOpen] = React.useReducer((isOpen) => !isOpen, false);
  const [isFilter2KebabOpen, toggleFilter2KebabOpen] = React.useReducer((isOpen) => !isOpen, false);

  const onAppKebabSelect = () => {
    toggleAppKebabOpen();
    onFocus('toggle-id-app-kebab');
  };

  const onFilter1KebabSelect = () => {
    toggleFilter1KebabOpen();
    onFocus('toggle-id-filter1');
  };

  const onFilter2KebabSelect = () => {
    toggleFilter2KebabOpen();
    onFocus('toggle-id-filter2');
  };

  const appDropdownItems = [
    <DropdownItem key="app-delete" component="button" onClick={() => alert('todo confirm delete')}>
      Delete
    </DropdownItem>,
    <DropdownItem
      key="app-view-pipelies"
      component="button"
      onClick={() => alert('todo view pipelines')}
    >
      View pipelines
    </DropdownItem>,
  ];

  const filter1DropdownItems = [
    <DropdownItem key="filter1-option1" component="button" onClick={() => alert('todo')}>
      option-1
    </DropdownItem>,
    <DropdownItem key="filter1-option2" component="button" onClick={() => alert('todo')}>
      option-2
    </DropdownItem>,
  ];

  const filter2DropdownItems = [
    <DropdownItem key="filter2-option1" component="button" onClick={() => alert('todo')}>
      option-1
    </DropdownItem>,
    <DropdownItem key="filter2-option2" component="button" onClick={() => alert('todo')}>
      option-2
    </DropdownItem>,
  ];

  return (
    <>
      <PageSection variant="light" type="tabs" className={spacing.pMd}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick} isBox>
          <Tab eventKey={0} title={<TabTitleText>application-0</TabTitleText>}>
            <Grid hasGutter className={spacing.ptMd}>
              <GridItem span={6}>
                <Title headingLevel="h3">application-0</Title>
              </GridItem>

              <GridItem span={6}>
                <Button
                  onClick={() => alert('todo copy pvc data')}
                  variant="secondary"
                  className="pf-u-mr-sm"
                >
                  Copy PVC data
                </Button>
                <Button onClick={() => alert('todo start cutover')} variant="secondary">
                  Cutover
                </Button>
                <Dropdown
                  onSelect={onAppKebabSelect}
                  toggle={<KebabToggle onToggle={toggleAppKebabOpen} id="toggle-id-app-kebab" />}
                  isOpen={isAppKebabOpen}
                  isPlain
                  dropdownItems={appDropdownItems}
                />
              </GridItem>

              <GridItem>
                <TableComposable
                  aria-label="Application import review"
                  variant="compact"
                  borders={false}
                  gridBreakPoint="grid"
                >
                  <Thead>
                    <Th modifier="nowrap" id="source-project-heading">
                      Source project
                    </Th>
                    <Th modifier="nowrap" id="pvc-heading">
                      Persistant volume claims
                    </Th>
                    <Th modifier="nowrap" id="status-heading">
                      Status
                    </Th>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td
                        className="pf-m-truncate"
                        dataLabel="Source project"
                        aria-labelledby="source-project-heading"
                      >
                        my-project
                      </Td>
                      <Td
                        className="pf-m-truncate"
                        dataLabel="Persistant volume claims"
                        aria-labelledby="pvc-heading"
                      >
                        1
                      </Td>
                      <Td
                        className="pf-m-truncate"
                        dataLabel="Status"
                        aria-labelledby="status-heading"
                      >
                        Ready
                      </Td>
                    </Tr>
                  </Tbody>
                </TableComposable>
              </GridItem>
            </Grid>
          </Tab>

          <Tab isDisabled eventKey={1} title={<TabTitleText>application-1</TabTitleText>}>
            stub
          </Tab>
        </Tabs>
      </PageSection>

      <PageSection variant="light" type="default" className={spacing.pMd}>
        <Grid hasGutter>
          <GridItem>
            <Title headingLevel="h3">&quot;Pipeline&quot; history</Title>
          </GridItem>

          <GridItem>
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <Dropdown
                    onSelect={onFilter1KebabSelect}
                    toggle={
                      <DropdownToggle
                        toggleIndicator={CaretDownIcon}
                        onToggle={toggleFilter1KebabOpen}
                        id="toggle-id-filter1"
                      >
                        Filter 1
                      </DropdownToggle>
                    }
                    isOpen={isFilter1KebabOpen}
                    isPlain
                    dropdownItems={filter1DropdownItems}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    onSelect={onFilter2KebabSelect}
                    toggle={
                      <DropdownToggle
                        toggleIndicator={CaretDownIcon}
                        onToggle={toggleFilter2KebabOpen}
                        id="toggle-id-filter2"
                      >
                        Filter 2
                      </DropdownToggle>
                    }
                    isOpen={isFilter2KebabOpen}
                    isPlain
                    dropdownItems={filter2DropdownItems}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => {
                      alert('todo');
                    }}
                  >
                    Button
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      alert('todo');
                    }}
                  >
                    Button
                  </Button>
                </ToolbarItem>
                <ToolbarItem>kebab-dropdown</ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </GridItem>

          <GridItem>
            <TableComposable
              aria-label="Pipeline history"
              variant="compact"
              borders={false}
              gridBreakPoint="grid-md"
            >
              <Thead>
                <Th modifier="nowrap" id="pipeline-run-heading">
                  Pipeline run
                </Th>
                <Th modifier="nowrap" id="executed-heading">
                  Executed
                </Th>
                <Th modifier="nowrap" id="result-heading">
                  Result
                </Th>
                <Th modifier="nowrap" id="delete-heading"></Th>
              </Thead>
              <Tbody>
                {pipelines &&
                  pipelines.data &&
                  pipelines.data
                    .filter((pipeline) => pipeline.metadata?.name?.includes('-stage')) // or filter -cutover?
                    .map((el) => {
                      return (
                        <Tr key={`${el.metadata?.name}`}>
                          <Td
                            className="pf-m-truncate"
                            dataLabel="Pipeline run"
                            aria-labelledby="pipeline-run-heading"
                          >
                            {el.metadata?.name}
                          </Td>
                          <Td
                            className="pf-m-truncate"
                            dataLabel="Executed"
                            aria-labelledby="executed-heading"
                          >
                            {el.metadata?.creationTimestamp}
                          </Td>
                          <Td
                            className="pf-m-truncate"
                            dataLabel="Result"
                            aria-labelledby="result-heading"
                          >
                            todo
                          </Td>
                          <Td
                            className="pf-m-truncate"
                            dataLabel=""
                            aria-labelledby="delete-heading"
                          >
                            <Button
                              variant="secondary"
                              onClick={() =>
                                alert(`todo implement delete for ${el.metadata?.name}`)
                              }
                            >
                              Delete
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
              </Tbody>
            </TableComposable>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};
