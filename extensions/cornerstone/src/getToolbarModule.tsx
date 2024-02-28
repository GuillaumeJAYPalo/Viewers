export default function getToolbarModule({ commandsManager, servicesManager }) {
  const {
    toolGroupService,
    cornerstoneViewportService,
    hangingProtocolService,
    displaySetService,
    viewportGridService,
  } = servicesManager.services;

  return [
    // functions/helpers to be used by the toolbar buttons to decide if they should
    // enabled or not
    {
      name: 'evaluate.cornerstoneTool',
      evaluate: ({ viewportId, button }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return;
        }

        const toolName = getToolNameForButton(button);

        if (!toolGroup || !toolGroup.hasTool(toolName)) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
          };
        }

        const isPrimaryActive = toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          className: isPrimaryActive
            ? 'text-black bg-primary-light'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          // Todo: isActive right now is used for nested buttons where the primary
          // button needs to be fully rounded (vs partial rounded) when active
          // otherwise it does not have any other use
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.group',
      evaluate: ({ viewportId, button, itemId }) => {
        const { items } = button.props;

        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        const activeToolName = toolGroup.getActivePrimaryMouseButtonTool();

        // check if the active toolName is part of the items then we need
        // to move it to the primary button
        const activeToolIndex = items.findIndex(item => {
          const toolName = getToolNameForButton(item);
          return toolName === activeToolName;
        });

        // if there is an active tool in the items dropdown bound to the primary mouse/touch
        // we should show that no matter what
        if (activeToolIndex > -1) {
          return {
            primary: items[activeToolIndex],
            items,
          };
        }

        if (!itemId) {
          return {
            primary: button.props.primary,
            items,
          };
        }

        // other wise we can move the clicked tool to the primary button
        const clickedItemProps = items.find(item => item.id === itemId || item.itemId === itemId);

        return {
          primary: clickedItemProps,
          items,
        };
      },
    },
    {
      name: 'evaluate.action',
      evaluate: ({ viewportId, button }) => {
        return {
          className: 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.toggle',
      evaluate: ({ viewportId, button }) => {
        const isToggled = true;
        return {
          className: isToggled
            ? 'text-primary-active'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.viewportProperties.toggle',
      evaluate: ({ viewportId, button }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        const propId = button.id;

        const properties = viewport.getProperties();
        const camera = viewport.getCamera();

        const prop = properties[propId] || camera[propId];

        if (!prop) {
          return {
            disabled: false,
            className: 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
          };
        }

        const isToggled = prop;

        return {
          className: isToggled
            ? 'text-primary-active'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
    {
      name: 'evaluate.mpr',
      evaluate: ({ viewportId, button }) => {
        const { protocol } = hangingProtocolService.getActiveProtocol();

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs.length) {
          return;
        }

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        const areReconstructable = displaySets.every(displaySet => {
          return displaySet.isReconstructable;
        });

        if (!areReconstructable) {
          return {
            disabled: true,
            className: '!text-common-bright ohif-disabled',
          };
        }

        const isMpr = protocol?.id === 'mpr';

        return {
          disabled: false,
          className: isMpr
            ? 'text-primary-active'
            : 'text-common-bright hover:!bg-primary-dark hover:text-primary-light',
        };
      },
    },
  ];
}

function getToolNameForButton(button) {
  const { props } = button;

  const commands = props?.commands || button.commands;

  if (commands && commands.length) {
    const command = commands[0];
    const { commandOptions } = command;
    const { toolName } = commandOptions || { toolName: props?.id ?? button.id };
    return toolName;
  }
  return null;
}