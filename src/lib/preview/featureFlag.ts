export function isPreviewFeatureEnabled(search: string): boolean {
  return new URLSearchParams(search).get('preview') === '1';
}
