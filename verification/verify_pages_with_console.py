from playwright.sync_api import sync_playwright

def verify_terms_and_guidelines():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Verify Terms of Service Page
        print("Navigating to Terms of Service...")
        page.goto("http://localhost:5173/terms")

        # Wait a bit
        page.wait_for_timeout(3000)

        try:
            page.wait_for_selector("h1:has-text('Terms of Service')", timeout=5000)
            page.screenshot(path="verification/terms_page.png")
            print("Terms of Service page verified and screenshot saved.")
        except Exception as e:
            print(f"Failed to find Terms of Service header: {e}")
            page.screenshot(path="verification/failed_terms.png")

        # Verify Sidebar Links (from Home)
        print("Navigating to Home to check sidebar...")
        page.goto("http://localhost:5173/")
        page.wait_for_timeout(3000)

        try:
            page.wait_for_selector("text=Legal", timeout=5000)
            page.wait_for_selector("a[href='/terms']", timeout=5000)
            page.screenshot(path="verification/sidebar_links.png")
            print("Sidebar links verified and screenshot saved.")
        except Exception as e:
            print(f"Failed to find Sidebar links: {e}")
            page.screenshot(path="verification/failed_sidebar.png")

        browser.close()

if __name__ == "__main__":
    verify_terms_and_guidelines()
