from playwright.sync_api import sync_playwright

def debug_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to Terms of Service...")
            page.goto("http://localhost:5173/terms")
            page.wait_for_timeout(2000) # Wait a bit for JS to execute
            page.screenshot(path="verification/debug_terms.png")
            print("Screenshot saved to verification/debug_terms.png")

            # Print page content to see if there are errors
            content = page.content()
            print("Page Content Snippet:", content[:500])
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    debug_screenshot()
