from playwright.sync_api import sync_playwright

def verify_terms_and_guidelines():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Verify Terms of Service Page
        print("Navigating to Terms of Service...")
        page.goto("http://localhost:5173/terms")
        page.wait_for_selector("h1:has-text('Terms of Service')")
        page.screenshot(path="verification/terms_page.png")
        print("Terms of Service page verified and screenshot saved.")

        # Verify Community Guidelines Page
        print("Navigating to Community Guidelines...")
        page.goto("http://localhost:5173/guidelines")
        page.wait_for_selector("h1:has-text('Community Guidelines')")
        page.screenshot(path="verification/guidelines_page.png")
        print("Community Guidelines page verified and screenshot saved.")

        # Verify Sidebar Links (from Home)
        print("Navigating to Home to check sidebar...")
        page.goto("http://localhost:5173/")
        page.wait_for_selector("text=Legal")
        page.wait_for_selector("a[href='/terms']")
        page.wait_for_selector("a[href='/guidelines']")
        page.screenshot(path="verification/sidebar_links.png")
        print("Sidebar links verified and screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_terms_and_guidelines()
