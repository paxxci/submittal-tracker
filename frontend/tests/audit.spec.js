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
    await page.click('button:has-text("Add Project")');
    await page.fill('input[placeholder="e.g. 24001"]', 'TEST-123');
    await page.fill('input[placeholder="e.g. Gotham City Hospital"]', 'Audit Test Project');
    await page.click('button:has-text("Create Project")');
    
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
    
    // Verify Activity Log is visible
    await expect(page.locator('.activity-feed')).toBeVisible();
    
    // Add an audit note
    const noteText = `Audit Passed: ${new Date().toISOString()}`;
    await page.fill('textarea[placeholder="Add a progress note..."]', noteText);
    await page.click('button >> .lucide-send'); // The send icon button
    
    // Check for note in feed
    await expect(page.locator('.activity-msg').filter({ hasText: 'Audit Passed' })).toBeVisible();
  });

  test('Guard 6: Panel Coordination (Chat Shift)', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('.submittal-row:first-child');
    
    // Detail panel should be open. Now check the Chat FAB position
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
    await page.selectOption('#select-status', 'approved');
    
    // Change should reflect in the row badge (Approved is usually green)
    const rowBadge = page.locator('.submittal-row:first-child .badge-approved');
    await expect(rowBadge).toBeVisible();
  });

  test('Guard 8: Spec Intel Workbench Entry', async ({ page }) => {
    await page.click('.project-card:first-child');
    await page.click('button:has-text("Spec Intel")'); 
    await expect(page.locator('text=Spec Intel Hub')).toBeVisible();
    await expect(page.locator('.spec-dropzone')).toBeVisible();
  });

  test('Guard 9: Account & Security Access', async ({ page }) => {
    // Click account button in NavRail (usually bottom)
    await page.click('.nav-btn:last-child');
    await expect(page.locator('text=Security')).toBeVisible();
    await expect(page.locator('text=Password Management')).toBeVisible();
  });

  test('Guard 10: Global Search & Filtering', async ({ page }) => {
    await page.click('.project-card:first-child');
    const searchInput = page.locator('#search-submittals');
    await searchInput.fill('UNLIKELY_MATCH_XYZ');
    await expect(page.locator('text=No results')).toBeVisible();
    await searchInput.fill(''); // Clear search
  });

  test('Guard 11: AI Chat Responsiveness', async ({ page }) => {
    const chatFab = page.locator('.chat-fab-button');
    await chatFab.click();
    
    const chatWindow = page.locator('.chat-window');
    await expect(chatWindow).toBeVisible();
    
    // Should see initial assistant greeting
    await expect(page.locator('.chat-bubble.assistant').first()).toContainText('assistant');
  });

});
