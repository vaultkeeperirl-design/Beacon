from playwright.sync_api import sync_playwright
import time

def verify_polls():
    with sync_playwright() as p:
        # Launch with arguments to fake media devices so getUserMedia doesn't block or fail
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream"
            ]
        )
        context = browser.new_context(permissions=["camera", "microphone"])

        # 1. Host Session
        host_page = context.new_page()
        try:
            print("Navigating to broadcast page...")
            host_page.goto("http://localhost:5173/broadcast")

            # Wait for load
            print("Waiting for 'Broadcast Studio'...")
            host_page.wait_for_selector("text=Broadcast Studio", timeout=10000)

            # GO LIVE FIRST - Select the button in the main content, not the navbar
            print("Going Live...")
            # The button is next to "Stream Health" or inside the main header area
            # We can use the class or surrounding text
            host_page.click("button:has-text('Go Live') >> nth=1")
            # OR better:
            # host_page.click("div.flex-col button:has-text('Go Live')")

            # Wait for state change (End Stream button appears)
            print("Waiting for 'End Stream' button...")
            host_page.wait_for_selector("button:has-text('End Stream')", timeout=10000)

            # Start Poll
            print("Clicking 'Start Poll'...")
            host_page.click("button:has-text('Start Poll')")

            print("Waiting for modal...")
            host_page.wait_for_selector("text=Create Poll", timeout=5000)

            print("Filling form...")
            host_page.fill("input[placeholder='Ask your community something...']", "Best Framework?")
            host_page.fill("input[placeholder='Option 1']", "React")
            host_page.fill("input[placeholder='Option 2']", "Vue")

            # Submit - Button inside modal
            print("Submitting poll...")
            host_page.click("button.bg-beacon-600:has-text('Start Poll')") # More specific selector

            print("Waiting for poll widget...")
            host_page.wait_for_selector("text=Best Framework?", timeout=5000)

            host_page.screenshot(path="verification-host-poll.png")
            print("Screenshot taken: verification-host-poll.png")

            # Vote as host
            print("Voting...")
            host_page.click("text=React")

            # Wait for update
            host_page.wait_for_selector("text=100%", timeout=5000)
            host_page.screenshot(path="verification-host-voted.png")
            print("Screenshot taken: verification-host-voted.png")

        except Exception as e:
            print(f"Error: {e}")
            host_page.screenshot(path="verification-error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_polls()
