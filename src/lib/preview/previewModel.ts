import type { PreviewControl } from 'zoia2pd';
import type { Patch } from '@/lib/zoia/types';
import { getModuleDefinition } from '@/lib/zoia/moduleLib';

export interface PreviewControlGroup {
  key: string;
  moduleIndex: number;
  moduleName: string;
  colorIndex: number;
  controls: PreviewControl[];
}

export function getPreviewPageCount(patch: Patch): number {
  const maxModulePage = patch.modules.reduce((max, module) => Math.max(max, module.page), 0);
  return Math.max(maxModulePage + 1, patch.pageNames?.length || 0, 1);
}

export function getPreviewPageName(patch: Patch, pageIndex: number): string {
  return patch.pageNames?.[pageIndex]?.replace(/\0/g, '').trim() || `Page ${pageIndex + 1}`;
}

export function getControlPage(control: PreviewControl): number {
  return control.kind === 'connection'
    ? control.destination.pageIndex
    : control.module.pageIndex;
}

export function getControlModuleIndex(control: PreviewControl): number {
  return control.kind === 'connection'
    ? control.destination.moduleIndex
    : control.module.index;
}

export function groupPreviewControls(
  controls: PreviewControl[],
  pageIndex: number,
  patch: Patch,
): PreviewControlGroup[] {
  const groups = new Map<number, PreviewControlGroup>();

  for (const control of controls) {
    if (getControlPage(control) !== pageIndex) continue;

    const moduleIndex = getControlModuleIndex(control);
    const patchModule = patch.modules.find((module) => module.index === moduleIndex);
    const manifestModule = control.kind === 'connection' ? undefined : control.module;
    const definition = patchModule ? getModuleDefinition(patchModule.typeId) : undefined;
    const group = groups.get(moduleIndex) ?? {
      key: `module-${moduleIndex}`,
      moduleIndex,
      moduleName:
        manifestModule?.name?.trim() ||
        patchModule?.name?.replace(/\0/g, '').trim() ||
        manifestModule?.typeName ||
        definition?.name ||
        `Module ${moduleIndex + 1}`,
      colorIndex: manifestModule?.colorIndex ?? patchModule?.color ?? 0,
      controls: [],
    };

    group.controls.push(control);
    groups.set(moduleIndex, group);
  }

  return [...groups.values()].sort((left, right) => left.moduleIndex - right.moduleIndex);
}

export function isMappedControl(control: PreviewControl): boolean {
  if (control.kind === 'parameter' || control.kind === 'connection') return true;
  if (control.kind === 'ui-button') return Boolean(control.star);
  if (control.kind === 'keyboard') return control.keys.some((key) => Boolean(key.star));
  return control.stars.length > 0;
}

export function getModuleColor(colorIndex: number): string {
  const colors: Record<number, string> = {
    0: '#6b7280',
    1: '#3b82f6',
    2: '#22c55e',
    3: '#ef4444',
    4: '#eab308',
    5: '#06b6d4',
    6: '#d946ef',
    7: '#ffffff',
    8: '#f97316',
    9: '#84cc16',
    10: '#14b8a6',
    11: '#0ea5e9',
    12: '#a855f7',
    13: '#ec4899',
    14: '#f43f5e',
    15: '#f59e0b',
  };

  return colors[colorIndex] || '#9ca3af';
}
