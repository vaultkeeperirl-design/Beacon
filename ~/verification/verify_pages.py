from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to Home page...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        # 1. Verify Home Page
        print("Taking screenshot of Home page...")
        page.screenshot(path="/home/jules/verification/home_page.png")

        # Check if the stream grid is gone (MOCK_STREAMS titles should not be present)
        # We can check for a specific stream title that was there before
        is_stream_visible = page.get_by_text("Building a P2P streaming app from scratch").is_visible()
        if is_stream_visible:
             print("FAILURE: Stream grid still visible on Home page!")
        else:
             print("SUCCESS: Stream grid not found on Home page.")

        # Check for the new "Browse Channels" button
        browse_button = page.get_by_role("link", name="Browse Channels")
        if browse_button.is_visible():
             print("SUCCESS: 'Browse Channels' button is visible.")
        else:
             print("FAILURE: 'Browse Channels' button not found.")


        # 2. Verify Browse Page
        print("Navigating to Browse page via sidebar...")
        # Click the sidebar link
        page.get_by_role("link", name="Browse").click()
        page.wait_for_url("**/browse")
        page.wait_for_load_state("networkidle")

        print("Taking screenshot of Browse page...")
        page.screenshot(path="/home/jules/verification/browse_page.png")

        # Check if stream grid is present here
        is_stream_visible_browse = page.get_by_text("Building a P2P streaming app from scratch").is_visible()
        if is_stream_visible_browse:
             print("SUCCESS: Stream grid visible on Browse page.")
        else:
             print("FAILURE: Stream grid not found on Browse page!")

        browser.close()

if __name__ == "__main__":
    verify_changes()
