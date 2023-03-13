import { Types, Enums } from '@cornerstonejs/core';
import { Types as UITypes } from '@ohif/ui';
import {
  StackViewportData,
  VolumeViewportData,
} from '../../types/CornerstoneCacheService';
import getCornerstoneBlendMode from '../../utils/getCornerstoneBlendMode';
import getCornerstoneOrientation from '../../utils/getCornerstoneOrientation';
import getCornerstoneViewportType from '../../utils/getCornerstoneViewportType';
import JumpPresets from '../../utils/JumpPresets';
import { SyncGroup } from '../SyncGroupService/SyncGroupService';

export type InitialImageOptions = {
  index?: number;
  preset?: JumpPresets;
};

export type ViewportOptions = {
  id?: string;
  viewportType: Enums.ViewportType;
  toolGroupId: string;
  viewportId: string;
  // Presentation ID to store/load presentation state from
  presentationIds?: UITypes.PresentationIds;
  orientation?: Enums.OrientationAxis;
  background?: Types.Point3;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportProps?: Record<string, unknown>;
  /*
   * Allows drag and drop of display sets not matching viewport options, but
   * doesn't show them initially.  Displays initially blank if no required match
   */
  allowUnmatchedView?: boolean;
};

export type PublicViewportOptions = {
  id?: string;
  viewportType?: string;
  toolGroupId?: string;
  presentationIds?: UITypes.PresentationIds;
  viewportId?: string;
  orientation?: Enums.OrientationAxis;
  background?: Types.Point3;
  syncGroups?: SyncGroup[];
  initialImageOptions?: InitialImageOptions;
  customViewportProps?: Record<string, unknown>;
  allowUnmatchedView?: boolean;
};

export type PublicDisplaySetOptions = {
  /** The display set options can have an id in order to distinguish
   * it from other similar items.
   */
  id?: string;
  voi?: VOI;
  voiInverted?: boolean;
  blendMode?: string;
  slabThickness?: number;
  colormap?: string;
  presetName?: string;
};

export type DisplaySetOptions = {
  id?: string;
  voi?: VOI;
  voiInverted: boolean;
  blendMode?: Enums.BlendModes;
  slabThickness?: number;
  colormap?: string;
  presetName?: string;
};

type VOI = {
  windowWidth: number;
  windowCenter: number;
};

export type DisplaySet = {
  displaySetInstanceUID: string;
};

const STACK = 'stack';
const DEFAULT_TOOLGROUP_ID = 'default';

class ViewportInfo {
  private viewportId = '';
  private viewportIndex: number;
  private element: HTMLDivElement;
  private viewportOptions: ViewportOptions;
  private displaySetOptions: Array<DisplaySetOptions>;
  private viewportData: StackViewportData | VolumeViewportData;
  private renderingEngineId: string;

  constructor(viewportIndex: number, viewportId: string) {
    this.viewportIndex = viewportIndex;
    this.viewportId = viewportId;
    this.setPublicViewportOptions({});
    this.setPublicDisplaySetOptions([{}]);
  }

  public destroy = (): void => {
    this.element = null;
    this.viewportData = null;
    this.viewportOptions = null;
    this.displaySetOptions = null;
  };

  public setRenderingEngineId(renderingEngineId: string): void {
    this.renderingEngineId = renderingEngineId;
  }

  public getRenderingEngineId(): string {
    return this.renderingEngineId;
  }

  public setViewportId(viewportId: string): void {
    this.viewportId = viewportId;
  }
  public setViewportIndex(viewportIndex: number): void {
    this.viewportIndex = viewportIndex;
  }

  public setElement(element: HTMLDivElement): void {
    this.element = element;
  }

  public setViewportData(
    viewportData: StackViewportData | VolumeViewportData
  ): void {
    this.viewportData = viewportData;
  }

  public getViewportData(): StackViewportData | VolumeViewportData {
    return this.viewportData;
  }

  public getViewportIndex(): number {
    return this.viewportIndex;
  }

  public getElement(): HTMLDivElement {
    return this.element;
  }

  public getViewportId(): string {
    return this.viewportId;
  }

  public setPublicDisplaySetOptions(
    publicDisplaySetOptions: Array<PublicDisplaySetOptions>
  ): void {
    // map the displaySetOptions and check if they are undefined then set them to default values
    const displaySetOptions = this.mapDisplaySetOptions(
      publicDisplaySetOptions
    );

    this.setDisplaySetOptions(displaySetOptions);
  }

  public hasDisplaySet(displaySetInstanceUID: string): boolean {
    // Todo: currently this does not work for non image & referenceImage displaySets.
    // Since SEG and other derived displaySets are loaded in a different way, and not
    // via cornerstoneViewportService
    let viewportData = this.getViewportData();

    if (viewportData.viewportType === Enums.ViewportType.ORTHOGRAPHIC) {
      viewportData = viewportData as VolumeViewportData;
      return viewportData.data.some(
        ({ displaySetInstanceUID: dsUID }) => dsUID === displaySetInstanceUID
      );
    }

    viewportData = viewportData as StackViewportData;
    return viewportData.data.displaySetInstanceUID === displaySetInstanceUID;
  }

  public setPublicViewportOptions(
    viewportOptionsEntry: PublicViewportOptions
  ): void {
    let viewportType = viewportOptionsEntry.viewportType;
    const {
      toolGroupId = DEFAULT_TOOLGROUP_ID,
      presentationIds,
    } = viewportOptionsEntry;
    let orientation;

    if (!viewportType) {
      viewportType = getCornerstoneViewportType(STACK);
    } else {
      viewportType = getCornerstoneViewportType(
        viewportOptionsEntry.viewportType
      );
    }

    // map SAGITTAL, AXIAL, CORONAL orientation to be used by cornerstone
    if (viewportOptionsEntry.viewportType?.toLowerCase() !== STACK) {
      orientation = getCornerstoneOrientation(viewportOptionsEntry.orientation);
    }

    if (!toolGroupId) {
      toolGroupId = DEFAULT_TOOLGROUP_ID;
    }

    this.setViewportOptions({
      ...viewportOptionsEntry,
      viewportId: this.viewportId,
      viewportType: viewportType as Enums.ViewportType,
      orientation,
      toolGroupId,
      presentationIds,
    });
  }

  public setViewportOptions(viewportOptions: ViewportOptions): void {
    this.viewportOptions = viewportOptions;
  }

  public getViewportOptions(): ViewportOptions {
    return this.viewportOptions;
  }

  public setDisplaySetOptions(
    displaySetOptions: Array<DisplaySetOptions>
  ): void {
    this.displaySetOptions = displaySetOptions;
  }

  public getSyncGroups(): SyncGroup[] {
    if (!this.viewportOptions.syncGroups) {
      this.viewportOptions.syncGroups = [];
  }
    return this.viewportOptions.syncGroups;
  }

  public getDisplaySetOptions(): Array<DisplaySetOptions> {
    return this.displaySetOptions;
  }

  public getViewportType(): Enums.ViewportType {
    return this.viewportOptions.viewportType || Enums.ViewportType.STACK;
  }

  public getToolGroupId(): string {
    return this.viewportOptions.toolGroupId;
  }

  public getBackground(): Types.Point3 {
    return this.viewportOptions.background || [0, 0, 0];
  }

  public getOrientation(): Enums.OrientationAxis {
    return this.viewportOptions.orientation;
  }

  public getInitialImageOptions(): InitialImageOptions {
    return this.viewportOptions.initialImageOptions;
  }

  private mapDisplaySetOptions(
    publicDisplaySetOptions: Array<PublicDisplaySetOptions> = [{}]
  ): Array<DisplaySetOptions> {
    const displaySetOptions: Array<DisplaySetOptions> = [];

    publicDisplaySetOptions.forEach(option => {
      if (!option) {
        option = {
          blendMode: undefined,
          slabThickness: undefined,
          colormap: undefined,
          voi: {},
          voiInverted: false,
        };
      }
      const blendMode = getCornerstoneBlendMode(option.blendMode);

      displaySetOptions.push({
        voi: option.voi,
        voiInverted: option.voiInverted,
        colormap: option.colormap,
        slabThickness: option.slabThickness,
        blendMode,
        presetName: option.presetName,
      });
    });

    return displaySetOptions;
  }
}

export default ViewportInfo;
