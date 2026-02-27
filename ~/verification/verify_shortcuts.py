from playwright.sync_api import sync_playwright

def verify_video_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        print("Navigating to Watch page...")
        try:
            # Assuming the frontend is running on port 5173
            page.goto("http://localhost:5173/watch/test-stream", timeout=10000)

            print("Waiting for video player...")
            page.wait_for_selector("video", timeout=10000)

            print("Hovering to reveal controls...")
            # Hover over the video container
            video_container = page.locator("div.relative.aspect-video")
            video_container.hover()

            # Wait for any control button to be visible
            page.wait_for_selector("button[aria-label='Pause stream (Space/k)']", state="visible", timeout=5000)

            print("Verifying aria-labels...")
            # Check Play/Pause button
            play_btn = page.locator("button[aria-label='Pause stream (Space/k)']")
            if play_btn.is_visible():
                print("✅ Found Play/Pause button with correct shortcut hint")
            else:
                print("❌ Play/Pause button shortcut hint not found")

            # Check Mute button
            mute_btn = page.locator("button[aria-label='Mute audio (m)']")
            if mute_btn.is_visible():
                 print("✅ Found Mute button with correct shortcut hint")
            else:
                 print("❌ Mute button shortcut hint not found")

            # Check Fullscreen button
            fs_btn = page.locator("button[aria-label='Enter Fullscreen (f)']")
            if fs_btn.is_visible():
                 print("✅ Found Fullscreen button with correct shortcut hint")
            else:
                 print("❌ Fullscreen button shortcut hint not found")

            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/video_controls_verification.png")
            print("Screenshot saved.")

        except Exception as e:
            print(f"Error during verification: {e}")
            try:
                page.screenshot(path="/home/jules/verification/error_state.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    verify_video_controls()
