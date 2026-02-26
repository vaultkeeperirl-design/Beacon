from playwright.sync_api import sync_playwright
import time

def verify_channel_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create a context with a viewport large enough to see the layout
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # 1. Navigate to the app (using the dev server we just started)
            print("Navigating to Home...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Take a screenshot of Home to verify stream cards
            page.screenshot(path="/home/jules/verification/01_home_page.png")
            print("Screenshot 01_home_page.png saved.")

            # 2. Click on a streamer's avatar in the sidebar to go to their channel
            # The sidebar links are now: <a href="/channel/Streamer_1">...</a>
            print("Clicking sidebar link for Streamer_1...")
            page.click("a[href='/channel/Streamer_1']")
            page.wait_for_load_state("networkidle")

            # 3. Verify we are on the channel page
            # Check for the streamer's name in the header
            if page.locator("h1:has-text('Streamer_1')").is_visible():
                print("Successfully navigated to Streamer_1's channel page.")
            else:
                print("ERROR: Did not find Streamer_1's name on the page.")

            # 4. Take a screenshot of the Channel Page (Home tab)
            page.screenshot(path="/home/jules/verification/02_channel_page_home.png")
            print("Screenshot 02_channel_page_home.png saved.")

            # 5. Click the "About" tab
            print("Clicking About tab...")
            page.click("button:has-text('about')")
            time.sleep(0.5) # Wait for tab switch animation/render

            # 6. Take a screenshot of the About tab
            page.screenshot(path="/home/jules/verification/03_channel_page_about.png")
            print("Screenshot 03_channel_page_about.png saved.")

             # 7. Click the "Videos" tab
            print("Clicking Videos tab...")
            page.click("button:has-text('videos')")
            time.sleep(0.5)

            # 8. Take a screenshot of the Videos tab
            page.screenshot(path="/home/jules/verification/04_channel_page_videos.png")
            print("Screenshot 04_channel_page_videos.png saved.")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_channel_page()
