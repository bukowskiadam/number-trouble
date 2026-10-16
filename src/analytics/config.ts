// Public Website ID shared by the user's GitHub Pages applications.
export const UMAMI_WEBSITE_ID = 'a8bb101f-a5d7-4013-8c92-6a64b63e3cf2';

export function umamiEnabled(
  websiteId: string | undefined,
  production: boolean,
  hostname: string,
  allowedHostname: string,
) {
  return (
    production &&
    hostname === allowedHostname &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId ?? '')
  );
}
