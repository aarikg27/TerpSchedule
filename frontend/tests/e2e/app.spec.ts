import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const schedule = {
  rank: 1, total_score: 91,
  metrics: { avg_professor_rating: 4.2, avg_gpa: 3.1, gpa_sections_with_data: 1, gpa_sections_total: 1, total_credits: 4, total_gap_minutes: 10, active_days: 2, max_walk_time_mins: 5, open_sections: 1, unavailable_sections: 0, registerable_now: true },
  sections: [{ course_id: 'CMSC132', section_id: '0101', instructor: 'Test Professor', rating: 4.2, gpa: 3.1, gpa_available: true, credits: 4, seats_total: 30, open_seats: 4, waitlist_count: 0, availability: 'open', meetings: [{ day: 'M', start: '09:00', end: '09:50', building: 'IRB', room: '0324', class_type: 'Lecture' }] }],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/terms', route => route.fulfill({ json: { selected_term: '202608', terms: [{ id: '202608', label: 'Fall 2026', has_data: true }] } }));
  await page.route('**/api/v1/sync-status', route => route.fulfill({ json: { term: '202608', automatic: true, last_course_sync: new Date().toISOString(), departments_ready: 8, walking_last_sync: null, walking_pairs: 0 } }));
  await page.route('**/api/v1/optimize', route => route.fulfill({ json: { total_combinations_checked: 1, valid_schedules_count: 1, execution_time_ms: 1, schedules: [schedule], registerable_schedules_count: 1, waitlist_schedules_count: 0, open_schedules: [schedule], waitlist_schedules: [] } }));
  await page.route('**/api/v1/courses**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/walking-estimate')) return route.fulfill({ json: { origin: 'IRB', destination: 'MTH', origin_name: 'Iribe Center', destination_name: 'Mathematics Building', origin_latitude: 38.9891, origin_longitude: -76.9365, destination_latitude: 38.9882, destination_longitude: -76.9397, walk_minutes: 7, distance_meters: 510, source: 'umd_gis_estimate' } });
    if (url.pathname.endsWith('/MATH240')) return route.fulfill({ json: { course_id: 'MATH240', department: 'MATH', name: 'Linear Algebra', credits: 4, sections: [{ course_id: 'MATH240', section_id: '0201', instructor: 'Linear Professor', avg_rating: 4.7, avg_gpa: 3.55, seats_total: 30, open_seats: 8, waitlist_count: 0, meetings: [{ day: 'M', start_time: '10:00', end_time: '10:50', building: 'MTH', room: '1407', class_type: 'Lecture' }] }, { course_id: 'MATH240', section_id: '0202', instructor: 'Conflict Professor', avg_rating: 4.1, avg_gpa: 3.2, seats_total: 30, open_seats: 3, waitlist_count: 0, meetings: [{ day: 'M', start_time: '09:30', end_time: '10:20', building: 'MTH', room: '0101', class_type: 'Lecture' }] }] } });
    return route.fulfill({ json: [{ course_id: 'MATH240', department: 'MATH', name: 'Linear Algebra', credits: 4 }] });
  });
  await page.goto('/');
});

test('generates, opens details, and preserves dark theme', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  await page.getByRole('button', { name: /view cmsc132 section/i }).first().click();
  await expect(page.getByRole('dialog', { name: /cmsc132 section details/i })).toBeVisible();
  await page.getByRole('button', { name: /close details/i }).click();
  await page.getByRole('button', { name: /appearance settings/i }).click();
  await page.getByRole('button', { name: 'Dark' }).click();
  await page.getByRole('button', { name: /view cmsc132 section/i }).first().click();
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(28, 28, 30)');
});

test('has no serious or critical automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
});

test('planner results have no serious or critical automated accessibility violations', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(serious).toEqual([]);
});

test('dark planner results have no serious or critical automated accessibility violations', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('terpschedule-theme', 'dark'));
  await page.reload();
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
});

test('opens the optional account flow', async ({ page }) => {
  await page.getByRole('button', { name: /switch from system theme/i }).click();
  await page.getByRole('button', { name: 'Create account' }).click();
  const dialog = page.getByRole('dialog', { name: /create a terpschedule account/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('background-color', 'rgb(28, 28, 30)');
  const googleButton = page.getByRole('button', { name: /continue with google/i });
  await expect(googleButton).toBeVisible();
  await expect(googleButton).toHaveCSS('color', 'rgb(245, 245, 247)');
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('makes privacy and terms available before entering the planner', async ({ page }) => {
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('dialog', { name: /privacy policy/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Terms', exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('dialog', { name: /terms and disclaimer/i })).toBeVisible();
});

test('planner does not overflow a narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await expect(page.getByRole('button', { name: /export schedule/i })).toBeVisible();
});

test('shows a live indeterminate signal while schedules are being built', async ({ page }) => {
  await page.unroute('**/api/v1/optimize');
  await page.route('**/api/v1/optimize', async route => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ json: { total_combinations_checked: 1, valid_schedules_count: 1, execution_time_ms: 1, schedules: [schedule], registerable_schedules_count: 1, waitlist_schedules_count: 0, open_schedules: [schedule], waitlist_schedules: [] } });
  });
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  await expect(page.getByRole('status')).toContainText(/building your schedules|connecting to the scheduling server/i);
  await expect(page.locator('.generation-signal')).toBeVisible();
  await expect(page.locator('.generation-signal')).toHaveCSS('animation-name', 'generation-sweep');
  await expect(page.getByText(/exploring combinations/i)).toBeVisible();
  await expect(page.getByText(/CMSC132/).first()).toBeVisible();
});

test('keeps the active ranking card inside its scroll area and omits diagnostics', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  const rankingTab = page.getByRole('button', { name: 'Rankings' });
  if (await rankingTab.isVisible()) await rankingTab.click();
  await expect(page.getByText(/how this search was counted/i)).toHaveCount(0);
  const card = page.locator('.schedule-card-active');
  const cardBox = await card.boundingBox();
  const listBox = await card.locator('xpath=..').boundingBox();
  expect(cardBox).not.toBeNull(); expect(listBox).not.toBeNull();
  expect(cardBox!.x).toBeGreaterThanOrEqual(listBox!.x);
  expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(listBox!.x + listBox!.width + 1);
});

test('shows the landing page first and opens the planner', async ({ page }) => {
  await expect(page).toHaveTitle('TerpSchedule');
  await expect(page.getByRole('heading', { name: /build a week/i })).toBeVisible();
  await page.getByRole('button', { name: /build my schedule/i }).click();
  await expect(page).toHaveURL(/\/planner$/);
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await expect(page.getByText('Target Courses')).toBeVisible();
});

test('hydrates walking details for a restored schedule without changing page height on hover', async ({ page }) => {
  const savedSchedule = {
    ...schedule,
    sections: [
      { ...schedule.sections[0], meetings: [{ ...schedule.sections[0].meetings[0], next_course_id: 'MATH240', next_building: 'MTH', next_room: '1407', next_start: '10:00' }] },
      { course_id: 'MATH240', section_id: '0201', instructor: 'Linear Professor', rating: 4.7, gpa: 3.55, gpa_available: true, credits: 4, seats_total: 30, open_seats: 8, waitlist_count: 0, availability: 'open', meetings: [{ day: 'M', start: '10:00', end: '10:50', building: 'MTH', room: '1407', class_type: 'Lecture' }] },
    ],
  };
  await page.evaluate((item) => localStorage.setItem('terpschedule-saved-schedules-v2:guest', JSON.stringify([{ id: 'walk-test', name: 'Walking test', schedule: item, createdAt: new Date().toISOString() }])), savedSchedule);
  await page.reload();
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const rankings = page.getByRole('button', { name: 'Rankings' });
  if (await rankings.isVisible()) await rankings.click();
  await page.getByText('Walking test').click();
  const calendar = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await calendar.isVisible()) await calendar.click();
  const classCard = page.getByRole('button', { name: /view cmsc132 section/i }).first();
  await page.waitForTimeout(600);
  const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);
  await classCard.hover();
  await expect(page.getByText(/7 min walk/i)).toBeVisible();
  await page.waitForTimeout(200);
  const heightAfter = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(heightAfter).toBe(heightBefore);
  await classCard.click();
  await expect(page.getByRole('dialog', { name: /cmsc132 section details/i })).toContainText('about 7 min');
  await expect(page.getByRole('link', { name: /walking directions/i })).toHaveAttribute('href', /travelmode=walking/);
});

test('saves, renames, restores, and closes a schedule', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  const rankingTab = page.getByRole('button', { name: 'Rankings' });
  if (await rankingTab.isVisible()) await rankingTab.click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: /rename schedule 1/i }).click();
  const rename = page.getByRole('textbox', { name: /rename schedule 1/i });
  await rename.fill('Campus compact');
  await rename.press('Enter');
  await expect(page.getByText('Campus compact')).toBeVisible();
  await page.reload();
  if (await rankingTab.isVisible()) await rankingTab.click();
  await expect(page.getByText('Campus compact')).toBeVisible();
  await page.getByText('Campus compact').click();
  const gridTabAfterRestore = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await gridTabAfterRestore.isVisible()) await gridTabAfterRestore.click();
  await expect(page.getByRole('region', { name: 'Schedule summary' })).toContainText('3.10');
  await expect(page.getByRole('region', { name: 'Schedule summary' })).toContainText('4.2 / 5');
  if (await rankingTab.isVisible()) await rankingTab.click();
  await page.getByRole('button', { name: /close schedule/i }).click();
  const gridTab = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await gridTab.isVisible()) await gridTab.click();
  await expect(page.getByText('No Schedule Generated')).toBeVisible();
});

test('manually adds a real section and recalculates schedule metrics', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const gridTab = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await gridTab.isVisible()) await gridTab.click();
  await page.getByRole('button', { name: /add class/i }).click();
  const builder = page.getByRole('region', { name: 'Schedule builder' });
  await builder.getByPlaceholder(/search cmsc132/i).fill('MATH240');
  await builder.getByRole('button', { name: /MATH240/ }).click();
  await builder.getByRole('button', { name: 'Add', exact: true }).first().click();
  const summary = page.getByRole('region', { name: 'Schedule summary' });
  await expect(summary).toContainText('4');
  await expect(summary).toContainText('3.55');
  await expect(summary).toContainText('4.7 / 5');
  await expect(page.getByRole('button', { name: /view math240 section/i })).toBeVisible();
});

test('warns about manual conflicts and can replace the conflicting section', async ({ page }) => {
  await page.getByRole('button', { name: /build my schedule/i }).click();
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await page.getByRole('button', { name: /generate schedules/i }).click();
  const gridTab = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await gridTab.isVisible()) await gridTab.click();
  const builder = page.getByRole('region', { name: 'Schedule builder' });
  await builder.getByRole('button', { name: /add class/i }).click();
  await builder.getByPlaceholder(/search cmsc132/i).fill('MATH240');
  await builder.getByRole('button', { name: /MATH240/ }).click();
  await builder.getByRole('button', { name: 'Add', exact: true }).nth(1).click();
  await expect(builder.getByRole('alert')).toContainText('Conflicts with CMSC132 0101');
  await builder.getByRole('button', { name: /replace and add/i }).click();
  await expect(page.getByRole('button', { name: /view math240 section 0202/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /view cmsc132 section/i })).toHaveCount(0);
});
