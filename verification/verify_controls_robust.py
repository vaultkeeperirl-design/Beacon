from playwright.sync_api import sync_playwright
import time

def verify_video_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            # Navigate to a watch page
            print("Navigating to watch page...")
            page.goto("http://localhost:5173/watch/test-stream")

            # Wait for the video player to load
            print("Waiting for video player...")
            page.wait_for_selector("video", timeout=10000)

            # Locate the video container
            video_container = page.locator("div.relative.aspect-video").first

            # Hover to trigger the controls visibility
            print("Hovering over video player...")
            video_container.hover()

            # Wait a moment for the transition (opacity-0 -> opacity-100)
            time.sleep(1)

            # Check for specific controls
            # Play/Pause button (initially should be Pause if autoplay works, or Play if blocked)
            play_btn = page.locator("button[aria-label='Play stream']")
            pause_btn = page.locator("button[aria-label='Pause stream']")

            has_play_control = play_btn.is_visible() or pause_btn.is_visible()
            print(f"Play/Pause control visible: {has_play_control}")

            # Mute/Volume button
            mute_btn = page.locator("button[aria-label='Mute audio']")
            unmute_btn = page.locator("button[aria-label='Unmute audio']")

            has_volume_control = mute_btn.is_visible() or unmute_btn.is_visible()
            print(f"Volume control visible: {has_volume_control}")

            # Settings button
            settings_btn = page.locator("button[aria-label='Open stream settings']")
            print(f"Settings control visible: {settings_btn.is_visible()}")

            # Fullscreen button
            fs_enter_btn = page.locator("button[aria-label='Enter Fullscreen']")
            fs_exit_btn = page.locator("button[aria-label='Exit Fullscreen']")

            has_fs_control = fs_enter_btn.is_visible() or fs_exit_btn.is_visible()
            print(f"Fullscreen control visible: {has_fs_control}")

            # Take a screenshot
            screenshot_path = "verification/video_controls_verified.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_video_controls()
