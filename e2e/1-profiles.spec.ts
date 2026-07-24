// End-to-end coverage of the URL-driven profiles feature: #!/name filtering
// of apps, live switching on hashchange, per-profile title override, the
// #!/ clear, and invalid-name fallback. Seeds data through the API.
import { test, expect, APIRequestContext } from '@playwright/test';

const PASSWORD = 'e2e-password-123';

const authHeader = async (request: APIRequestContext) => {
  const res = await request.post('/api/auth', {
    data: { password: PASSWORD, duration: '1h' },
  });
  const { token } = (await res.json()).data;
  return { Authorization: `Bearer ${token}` };
};

test('profiles filter apps by URL, switch live, and override the title', async ({
  page,
  request,
}) => {
  const headers = await authHeader(request);

  // Two profiles; "work" overrides the page title
  const work = await request.post('/api/profiles', {
    headers,
    data: { name: 'work', overrides: { customTitle: 'Work Dashboard' } },
  });
  const home = await request.post('/api/profiles', {
    headers,
    data: { name: 'home' },
  });
  const workId = (await work.json()).data.id;
  const homeId = (await home.json()).data.id;

  // One app per profile, plus one shared (no assignment)
  await request.post('/api/apps', {
    headers,
    data: { name: 'WorkApp', url: 'work.local', profileIds: [workId] },
  });
  await request.post('/api/apps', {
    headers,
    data: { name: 'HomeApp', url: 'home.local', profileIds: [homeId] },
  });
  await request.post('/api/apps', {
    headers,
    data: { name: 'SharedApp', url: 'shared.local' },
  });

  // Base view (no profile) shows everything
  await page.goto('/');
  await expect(page.getByText('SharedApp')).toBeVisible();
  await expect(page.getByText('WorkApp')).toBeVisible();
  await expect(page.getByText('HomeApp')).toBeVisible();

  // #!/work -> WorkApp + SharedApp, not HomeApp; title overridden
  await page.goto('/#!/work');
  await expect(page.getByText('WorkApp')).toBeVisible();
  await expect(page.getByText('SharedApp')).toBeVisible();
  await expect(page.getByText('HomeApp')).toHaveCount(0);
  await expect(page).toHaveTitle('Work Dashboard');

  // Live switch to #!/home without a reload
  await page.evaluate(() => {
    window.location.hash = '#!/home';
  });
  await expect(page.getByText('HomeApp')).toBeVisible();
  await expect(page.getByText('SharedApp')).toBeVisible();
  await expect(page.getByText('WorkApp')).toHaveCount(0);

  // Remembered choice persists across a reload
  await page.goto('/');
  await expect(page.getByText('HomeApp')).toBeVisible();
  await expect(page.getByText('WorkApp')).toHaveCount(0);

  // #!/ clears the remembered profile -> back to base view
  await page.goto('/#!/');
  await expect(page.getByText('WorkApp')).toBeVisible();
  await expect(page.getByText('HomeApp')).toBeVisible();

  // Invalid profile name -> notification, falls back (base view here)
  await page.goto('/#!/doesnotexist');
  await expect(page.getByText(/does not exist/i)).toBeVisible();
  await expect(page.getByText('SharedApp')).toBeVisible();
});
