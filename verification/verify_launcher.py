from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock Electron IPC
        # We need to ensure window.electron is available before the script runs
        page.add_init_script("""
        window.electron = {
            ipcRenderer: {
                invoke: (channel) => {
                    if (channel === 'get-app-version') return Promise.resolve('1.0.1-TEST');
                    return Promise.resolve(null);
                },
                on: (channel, func) => {
                    console.log(`Mock on: ${channel}`);
                    return () => {};
                },
                send: (channel, data) => {
                    console.log(`Mock send: ${channel}`, data);
                }
            }
        };
        """)

        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173")

            # Wait for load
            page.wait_for_load_state("networkidle")

            # Check for Version
            print("Checking for version v1.0.1-TEST...")
            # It should say v1.0.1-TEST
            version_locator = page.get_by_text("v1.0.1-TEST")
            expect(version_locator).to_be_visible(timeout=5000)
            print("SUCCESS: Version 1.0.1-TEST is visible!")

            # Check for Draggable Region class
            print("Checking for .app-drag-region...")
            # Look for the header div with class 'app-drag-region'
            # We can select by class directly
            header = page.locator(".app-drag-region")
            expect(header).to_be_visible(timeout=5000)
            print("SUCCESS: Header with .app-drag-region is visible!")

            # Take screenshot
            screenshot_path = "verification/launcher_verification.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
