import { test, expect } from '@playwright/test';

test.describe('Submittal Tracker: 11 Essential Guards Audit', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Auth Bypass Guard
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-test-mode', 'true');
    });
    await page.goto('/');
  });

  test('Guard 1: Dashboard Foundation & Projects', async ({ page }) => {
    await expect(page).toHaveTitle(/Submittal Tracker/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
    // Verify projects grid exists
    const projectsGrid = page.locator('.projects-grid');
    await expect(projectsGrid).toBeVisible();
  });

  test('Guard 2: Project Creation Workflow', async ({ page }) => {
    await page.click('#btn-new-project');
    await page.fill('#input-project-number', 'TEST-123');
    await page.fill('#input-project-name', 'Audit Test Project');
    await page.click('#btn-create-project');

    // Success check
    await expect(page.locator('text=Audit Test Project')).toBeVisible();
  });

  test('Guard 3: Project Deep-Link & Entry', async ({ page }) => {
    // Click on a project card (using a generic selector)
    await page.click('.project-card:first-child');
    await expect(page.locator('.breadcrumb-active')).toBeVisible();
  });

  test('Guard 4: Submittal Manual Addition', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('#btn-add-submittal');
    await page.fill('#input-spec-section', '11 11 11');
    await page.fill('#input-item-name', 'Guard Test Submittal');
    await page.click('#btn-create-submittal');

    // Check table
    await expect(page.locator('text=Guard Test Submittal')).toBeVisible();
  });

  test('Guard 5: Detail Panel & Activity Log Persistence', async ({ page }) => {
    await page.click('.project-card:first-child');

    // Open the first submittal row
    await page.click('.submittal-row:first-child');
    await expect(page.locator('.detail-panel')).toBeVisible();

    // Switch to Activity tab
    await page.click('#tab-activity');
    await expect(page.locator('.activity-messages')).toBeVisible();

    // Add an audit note
    const noteText = `Audit Passed: ${new Date().toISOString()}`;
    await page.fill('#input-activity-note', noteText);
    await page.click('#btn-add-note');

    // Check for note in feed (wait for it to appear in mock)
    await expect(page.locator('.activity-msg').filter({ hasText: 'Audit Passed' })).toBeVisible();
  });

  test('Guard 6: Panel Coordination (Chat Shift)', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('.submittal-row:first-child');

    // Detail panel should be open. Wait for animation.
    await page.waitForTimeout(500);
    const chatButton = page.locator('.chat-fab-button');
    await expect(chatButton).toBeVisible();

    // Check for the 'shifted' class on the container
    const container = page.locator('.floating-chat-container');
    await expect(container).toHaveClass(/shifted/);
  });

  test('Guard 7: Status & Color Sync', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('.submittal-row:first-child');

    // Change status in detail panel
    await page.selectOption('#detail-status', 'approved');
    await page.click('#btn-save-detail');

    // Change should reflect in the row badge (Approved is usually green)
    const rowBadge = page.locator('.submittal-row:first-child .badge-approved');
    await expect(rowBadge).toBeVisible();
  });

  test('Guard 8: Spec Intel Workbench Entry', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('button:has-text("Spec Intel")');
    await expect(page.locator('text=Spec Intel Hub')).toBeVisible();
    await expect(page.locator('.spec-dropzone').first()).toBeVisible();
  });

  test('Guard 9: Account & Security Access', async ({ page }) => {
    // Use specific selectors to avoid "Security" ambiguity
    await page.click('#nav-account');
    await expect(page.locator('.top-bar-title')).toContainText('Security');
    await expect(page.locator('h2')).toContainText('Password Security');
  });

  test('Guard 10: Global Search & Filtering', async ({ page }) => {
    await page.click('.project-card:first-child');
    const searchInput = page.locator('#search-submittals');
    await searchInput.fill('UNLIKELY_MATCH_XYZ');
    await expect(page.locator('text=No results')).toBeVisible();
    await searchInput.fill(''); // Clear search
  });

  test('Guard 11: AI Chat Responsiveness', async ({ page }) => {
    await page.click('.project-card:first-child');
    const chatFab = page.locator('.chat-fab-button');
    await chatFab.click();

    const chatWindow = page.locator('.chat-window');
    await expect(chatWindow).toBeVisible();

    // Should see initial assistant greeting
    await expect(page.locator('.chat-bubble.assistant').first()).toContainText('assistant');
  });

});
