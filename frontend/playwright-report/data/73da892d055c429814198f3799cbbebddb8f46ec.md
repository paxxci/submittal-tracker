# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit.spec.js >> Submittal Tracker: 11 Essential Guards Audit >> Guard 10: Global Search & Filtering
- Location: tests\audit.spec.js:106:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
Call log:
  - navigating to "http://localhost:5174/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Submittal Tracker: 11 Essential Guards Audit', () => {
  4   |   
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // 1. Auth Bypass Guard
  7   |     await page.addInitScript(() => {
  8   |       window.localStorage.setItem('sb-test-mode', 'true');
  9   |     });
> 10  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  11  |   });
  12  | 
  13  |   test('Guard 1: Dashboard Foundation & Projects', async ({ page }) => {
  14  |     await expect(page).toHaveTitle(/Submittal Tracker/);
  15  |     await expect(page.locator('text=Dashboard')).toBeVisible();
  16  |     // Verify projects grid exists
  17  |     const projectsGrid = page.locator('.projects-grid');
  18  |     await expect(projectsGrid).toBeVisible();
  19  |   });
  20  | 
  21  |   test('Guard 2: Project Creation Workflow', async ({ page }) => {
  22  |     await page.click('button:has-text("Add Project")');
  23  |     await page.fill('input[placeholder="e.g. 24001"]', 'TEST-123');
  24  |     await page.fill('input[placeholder="e.g. Gotham City Hospital"]', 'Audit Test Project');
  25  |     await page.click('button:has-text("Create Project")');
  26  |     
  27  |     // Success check
  28  |     await expect(page.locator('text=Audit Test Project')).toBeVisible();
  29  |   });
  30  | 
  31  |   test('Guard 3: Project Deep-Link & Entry', async ({ page }) => {
  32  |     // Click on a project card (using a generic selector)
  33  |     await page.click('.project-card:first-child');
  34  |     await expect(page.locator('.breadcrumb-active')).toBeVisible();
  35  |   });
  36  | 
  37  |   test('Guard 4: Submittal Manual Addition', async ({ page }) => {
  38  |     await page.click('.project-card:first-child');
  39  |     await page.click('#btn-add-submittal');
  40  |     await page.fill('#input-spec-section', '11 11 11');
  41  |     await page.fill('#input-item-name', 'Guard Test Submittal');
  42  |     await page.click('#btn-create-submittal');
  43  |     
  44  |     // Check table
  45  |     await expect(page.locator('text=Guard Test Submittal')).toBeVisible();
  46  |   });
  47  | 
  48  |   test('Guard 5: Detail Panel & Activity Log Persistence', async ({ page }) => {
  49  |     await page.click('.project-card:first-child');
  50  |     
  51  |     // Open the first submittal row
  52  |     await page.click('.submittal-row:first-child');
  53  |     await expect(page.locator('.detail-panel')).toBeVisible();
  54  |     
  55  |     // Verify Activity Log is visible
  56  |     await expect(page.locator('.activity-feed')).toBeVisible();
  57  |     
  58  |     // Add an audit note
  59  |     const noteText = `Audit Passed: ${new Date().toISOString()}`;
  60  |     await page.fill('textarea[placeholder="Add a progress note..."]', noteText);
  61  |     await page.click('button >> .lucide-send'); // The send icon button
  62  |     
  63  |     // Check for note in feed
  64  |     await expect(page.locator('.activity-msg').filter({ hasText: 'Audit Passed' })).toBeVisible();
  65  |   });
  66  | 
  67  |   test('Guard 6: Panel Coordination (Chat Shift)', async ({ page }) => {
  68  |     await page.click('.project-card:first-child');
  69  |     await page.click('.submittal-row:first-child');
  70  |     
  71  |     // Detail panel should be open. Now check the Chat FAB position
  72  |     const chatButton = page.locator('.chat-fab-button');
  73  |     await expect(chatButton).toBeVisible();
  74  |     
  75  |     // Check for the 'shifted' class on the container
  76  |     const container = page.locator('.floating-chat-container');
  77  |     await expect(container).toHaveClass(/shifted/);
  78  |   });
  79  | 
  80  |   test('Guard 7: Status & Color Sync', async ({ page }) => {
  81  |     await page.click('.project-card:first-child');
  82  |     await page.click('.submittal-row:first-child');
  83  |     
  84  |     // Change status in detail panel
  85  |     await page.selectOption('#select-status', 'approved');
  86  |     
  87  |     // Change should reflect in the row badge (Approved is usually green)
  88  |     const rowBadge = page.locator('.submittal-row:first-child .badge-approved');
  89  |     await expect(rowBadge).toBeVisible();
  90  |   });
  91  | 
  92  |   test('Guard 8: Spec Intel Workbench Entry', async ({ page }) => {
  93  |     await page.click('.project-card:first-child');
  94  |     await page.click('button:has-text("Spec Intel")'); 
  95  |     await expect(page.locator('text=Spec Intel Hub')).toBeVisible();
  96  |     await expect(page.locator('.spec-dropzone')).toBeVisible();
  97  |   });
  98  | 
  99  |   test('Guard 9: Account & Security Access', async ({ page }) => {
  100 |     // Click account button in NavRail (usually bottom)
  101 |     await page.click('.nav-btn:last-child');
  102 |     await expect(page.locator('text=Security')).toBeVisible();
  103 |     await expect(page.locator('text=Password Management')).toBeVisible();
  104 |   });
  105 | 
  106 |   test('Guard 10: Global Search & Filtering', async ({ page }) => {
  107 |     await page.click('.project-card:first-child');
  108 |     const searchInput = page.locator('#search-submittals');
  109 |     await searchInput.fill('UNLIKELY_MATCH_XYZ');
  110 |     await expect(page.locator('text=No results')).toBeVisible();
```