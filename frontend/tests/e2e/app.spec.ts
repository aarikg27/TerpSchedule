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
  await page.goto('/');
});

test('generates, opens details, and preserves dark theme', async ({ page }) => {
  await page.getByRole('button', { name: /start planning/i }).click();
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
  await page.getByRole('button', { name: /start planning/i }).click();
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
  await page.getByRole('button', { name: /start planning/i }).click();
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
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
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
  await page.getByRole('button', { name: /terms & disclaimer/i }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('dialog', { name: /terms and disclaimer/i })).toBeVisible();
});

test('planner does not overflow a narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /start planning/i }).click();
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await expect(page.getByRole('button', { name: /export schedule/i })).toBeVisible();
});

test('keeps the active ranking card inside its scroll area and omits diagnostics', async ({ page }) => {
  await page.getByRole('button', { name: /start planning/i }).click();
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
  await expect(page.getByRole('heading', { name: /your semester/i })).toBeVisible();
  await page.getByRole('button', { name: /start planning/i }).click();
  await expect(page).toHaveURL(/\/planner$/);
  const inputsTab = page.getByRole('button', { name: 'Inputs' });
  if (await inputsTab.isVisible()) await inputsTab.click();
  await expect(page.getByText('Target Courses')).toBeVisible();
});

test('saves, renames, restores, and closes a schedule', async ({ page }) => {
  await page.getByRole('button', { name: /start planning/i }).click();
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
  await page.getByRole('button', { name: /close schedule/i }).click();
  const gridTab = page.getByRole('button', { name: 'Calendar', exact: true });
  if (await gridTab.isVisible()) await gridTab.click();
  await expect(page.getByText('No Schedule Generated')).toBeVisible();
});
