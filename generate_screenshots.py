import os
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Increased viewport height slightly to ensure bottom elements are visible
        page = browser.new_page(viewport={"width": 1280, "height": 1000})

        base_url = "http://localhost:5173"
        os.makedirs("screenshots", exist_ok=True)

        # Home
        print(f"Navigating to {base_url}...")
        try:
            page.goto(base_url, wait_until="networkidle", timeout=60000)
            page.screenshot(path="screenshots/home_page.png", full_page=True)
            print("Captured home_page.png")
        except Exception as e:
            print(f"Error capturing home page: {e}")

        # Following
        print(f"Navigating to {base_url}/following...")
        try:
            page.goto(f"{base_url}/following", wait_until="networkidle", timeout=60000)
            page.screenshot(path="screenshots/following_page.png", full_page=True)
            print("Captured following_page.png")
        except Exception as e:
            print(f"Error capturing following page: {e}")

        # Broadcast
        print(f"Navigating to {base_url}/broadcast...")
        try:
            page.goto(f"{base_url}/broadcast", wait_until="networkidle", timeout=60000)
            page.screenshot(path="screenshots/broadcast_page.png", full_page=True)
            print("Captured broadcast_page.png")
        except Exception as e:
            print(f"Error capturing broadcast page: {e}")

        # Wallet
        print(f"Navigating to {base_url}/wallet...")
        try:
            page.goto(f"{base_url}/wallet", wait_until="networkidle", timeout=60000)
            page.screenshot(path="screenshots/wallet_page.png", full_page=True)
            print("Captured wallet_page.png")
        except Exception as e:
            print(f"Error capturing wallet page: {e}")

        # Watch (mock ID)
        print(f"Navigating to {base_url}/watch/demo-stream...")
        try:
            # Use domcontentloaded for watch page as networkidle might be too strict with continuous connections
            page.goto(f"{base_url}/watch/demo-stream", wait_until="domcontentloaded", timeout=60000)
            # Wait a bit for React to hydrate
            time.sleep(2)
            page.screenshot(path="screenshots/watch_page.png", full_page=True)
            print("Captured watch_page.png")
        except Exception as e:
             print(f"Error capturing watch page: {e}")

        browser.close()

if __name__ == "__main__":
    run()
