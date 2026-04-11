import { test, expect } from '@playwright/test';

test.describe('Submittal Tracker: Sequential Premium Audit', () => {
  
  test.beforeEach(async ({ page }) => {
    // Auth Bypass Guard
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-test-mode', 'true');
    });
  });

  test('The "11th Yard" Critical Path Audit', async ({ page }) => {
    // 1. Dashboard Load
    await page.goto('/');
    await expect(page).toHaveTitle(/Submittal Tracker/);
    
    // Either projects-grid OR empty-state should be visible
    const grid = page.locator('.projects-grid');
    const empty = page.locator('.empty-state');
    await expect(grid.or(empty)).toBeVisible();

    // 2. Project Creation Guard (The Spark)
    const projectName = `Audit Master ${Date.now().toString().slice(-4)}`;
    
    // Look for New Project button in top bar OR empty state
    const newBtn = page.locator('button:has-text("New Project")').first();
    await newBtn.click();
    
    // Wait for modal
    await page.waitForSelector('.modal');
    await page.fill('input[placeholder="e.g. 24001"]', 'AUDIT-11');
    await page.fill('input[placeholder="e.g. Gotham City Hospital"]', projectName);
    await page.click('button:has-text("Create Project")');
    
    // Wait for project to appear in grid
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });

    // 3. Project Entry Guard
    await page.click(`text=${projectName}`);
    await expect(page.locator('.breadcrumb-active')).toHaveText(projectName);

    // 4. Submittal Creation Guard
    await page.click('#btn-add-submittal');
    await page.fill('#input-spec-section', '05 10 00');
    await page.fill('#input-item-name', 'Structural Steel Deck');
    await page.click('#btn-create-submittal');
    await expect(page.locator('text=Structural Steel Deck')).toBeVisible();

    // 5. Detail Panel & Activity Log Guard
    await page.click('text=Structural Steel Deck');
    await expect(page.locator('.detail-panel')).toHaveClass(/open/);
    
    // Check for activity log
    await expect(page.locator('.activity-feed')).toBeVisible();
    
    // 6. Panel Overlap Coordination (Premium Layout Guard)
    const container = page.locator('.floating-chat-container');
    await expect(container).toHaveClass(/shifted/);

    // 7. Status & Sync Guard
    await page.selectOption('#select-status', 'working');
    // Ensure the "Working" badge appears in the row
    await expect(page.locator('.submittal-row').first().locator('.badge-working')).toBeVisible();

    // 8. Activity Persistence Guard
    const uniqueNote = `Audit Progress Checkpoint - ${Date.now()}`;
    await page.fill('textarea[placeholder="Add a progress note..."]', uniqueNote);
    await page.click('button >> .lucide-send');
    await expect(page.locator('.activity-msg').filter({ hasText: uniqueNote })).toBeVisible();

    // 9. Spec Intel Hub Navigation
    await page.click('button:has-text("Spec Intel")');
    await expect(page.locator('text=Spec Intel Hub')).toBeVisible();
    await page.click('button:has-text("Back to Workbench")'); // Back to project

    // 10. Account Security Guard
    await page.click('.nav-btn:last-child');
    await expect(page.locator('text=Security')).toBeVisible();
    await page.click('.nav-btn[title="Projects"]'); // Back to dashboard

    // 11. AI Chat Resilience
    const chatFab = page.locator('.chat-fab-button');
    await chatFab.click();
    await expect(page.locator('.chat-window')).toBeVisible();
    // Verify AI greeting
    await expect(page.locator('.chat-bubble.assistant').first()).toBeVisible();

    console.log("Audit Complete: 11/11 Guards Verified.");
  });

});
