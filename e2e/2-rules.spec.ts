// End-to-end coverage of the rules engine: a viewport rule auto-activates a
// profile on a narrow window, and the explicit #!/hash still overrides it.
import { test, expect, APIRequestContext } from '@playwright/test';

const PASSWORD = 'e2e-password-123';

const authHeader = async (request: APIRequestContext) => {
  const res = await request.post('/api/auth', {
    data: { password: PASSWORD, duration: '1h' },
  });
  const { token } = (await res.json()).data;
  return { Authorization: `Bearer ${token}` };
};

test('a viewport rule auto-activates a profile; hash still overrides', async ({
  page,
  request,
}) => {
  const headers = await authHeader(request);

  // "mobile" auto-activates on narrow viewports; "desk" is URL-only
  const mobile = await request.post('/api/profiles', {
    headers,
    data: {
      name: 'mobile',
      rules: [{ conditions: { viewport: { maxWidth: 700 } } }],
    },
  });
  const desk = await request.post('/api/profiles', {
    headers,
    data: { name: 'desk' },
  });
  const mobileId = (await mobile.json()).data.id;
  const deskId = (await desk.json()).data.id;

  await request.post('/api/apps', {
    headers,
    data: { name: 'MobileApp', url: 'm.local', profileIds: [mobileId] },
  });
  await request.post('/api/apps', {
    headers,
    data: { name: 'DeskApp', url: 'd.local', profileIds: [deskId] },
  });

  // Narrow viewport -> the mobile rule fires -> MobileApp shows, DeskApp hidden
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto('/');
  await expect(page.getByText('MobileApp')).toBeVisible();
  await expect(page.getByText('DeskApp')).toHaveCount(0);

  // Explicit hash outranks the matched rule
  await page.goto('/#!/desk');
  await expect(page.getByText('DeskApp')).toBeVisible();
  await expect(page.getByText('MobileApp')).toHaveCount(0);

  // Clear the remembered hash choice, widen the viewport: rule no longer
  // matches and there's no default -> base view (both visible)
  await page.goto('/#!/');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.getByText('MobileApp')).toBeVisible();
  await expect(page.getByText('DeskApp')).toBeVisible();
});
