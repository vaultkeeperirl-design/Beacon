from playwright.sync_api import sync_playwright

def verify_volume_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to a watch page
        page.goto("http://localhost:5173/watch/123")

        # Wait for video controls to be present
        # Note: Controls are hidden by default and appear on hover
        controls_container = page.locator(".aspect-video")
        controls_container.hover()

        # Check for volume slider presence
        # It's an input of type range in the video controls
        volume_slider = page.locator("input[type='range'][aria-label='Volume']")

        # Take a screenshot of the controls with the slider
        # We need to hover the container again right before screenshot to ensure controls are visible
        controls_container.hover()

        # Also hover the volume group to ensure the slider is fully opaque if we added that transition
        page.locator(".group\\/vol-control").hover()

        # Wait a moment for transitions
        page.wait_for_timeout(500)

        page.screenshot(path="verification_volume_slider.png")
        print("Screenshot saved to verification_volume_slider.png")

        browser.close()

if __name__ == "__main__":
    verify_volume_controls()
