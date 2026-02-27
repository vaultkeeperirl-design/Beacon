from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Wait for dev server to be ready
        try:
            page.goto("http://localhost:5173/watch/test-stream")
            # Wait for the buttons to be present
            page.wait_for_selector('button[aria-label="Like stream"]')
            page.wait_for_selector('button[aria-label="Share stream"]')
            page.wait_for_selector('button[aria-label="More options"]')

            # Take a screenshot
            page.screenshot(path="verification/accessibility_check.png")
            print("Successfully verified presence of aria-labels")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
