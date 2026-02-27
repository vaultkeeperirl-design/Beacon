from playwright.sync_api import sync_playwright
import time

def verify_video_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to a watch page
        page.goto("http://localhost:5173/watch/test-stream")

        # Wait for the page to load and video player to be visible
        page.wait_for_selector("video", timeout=10000)

        # Hover over the video player area to reveal controls
        # The controls are in a div with group-hover:opacity-100
        # We need to hover over the parent container
        video_container = page.locator("div.relative.aspect-video")
        video_container.hover()

        # Wait a moment for transition
        time.sleep(1)

        # Take a screenshot of the video player with controls visible
        page.screenshot(path="verification/video_controls.png")

        # Verify controls are present in the DOM
        # Play/Pause button
        play_pause_btn = page.locator("button[aria-label='Pause stream']")
        if not play_pause_btn.is_visible():
             play_pause_btn = page.locator("button[aria-label='Play stream']")

        print(f"Play/Pause button visible: {play_pause_btn.is_visible()}")

        # Mute/Unmute button
        mute_btn = page.locator("button[aria-label='Mute audio']")
        if not mute_btn.is_visible():
             mute_btn = page.locator("button[aria-label='Unmute audio']")

        print(f"Mute button visible: {mute_btn.is_visible()}")

        # Settings button
        settings_btn = page.locator("button[aria-label='Open stream settings']")
        print(f"Settings button visible: {settings_btn.is_visible()}")

        # Fullscreen button
        fullscreen_btn = page.locator("button[aria-label='Enter Fullscreen']")
        if not fullscreen_btn.is_visible():
             fullscreen_btn = page.locator("button[aria-label='Exit Fullscreen']")

        print(f"Fullscreen button visible: {fullscreen_btn.is_visible()}")

        browser.close()

if __name__ == "__main__":
    verify_video_controls()
