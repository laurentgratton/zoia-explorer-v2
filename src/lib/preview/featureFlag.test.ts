import { isPreviewFeatureEnabled } from './featureFlag';

describe('Preview feature flag', () => {
  it('requires the explicit preview=1 page argument', () => {
    expect(isPreviewFeatureEnabled('?preview=1')).toBe(true);
    expect(isPreviewFeatureEnabled('?other=value&preview=1')).toBe(true);
    expect(isPreviewFeatureEnabled('')).toBe(false);
    expect(isPreviewFeatureEnabled('?preview=0')).toBe(false);
    expect(isPreviewFeatureEnabled('?preview=true')).toBe(false);
  });
});
