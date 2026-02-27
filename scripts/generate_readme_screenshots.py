from playwright.sync_api import sync_playwright
import os
import time

def generate_screenshots():
    # Ensure screenshots directory exists
    if not os.path.exists("screenshots"):
        os.makedirs("screenshots")

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Create a new context with a larger viewport
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Define routes to capture
        routes = [
            {"name": "home_page", "path": "/"},
            {"name": "following_page", "path": "/following"},
            {"name": "browse_page", "path": "/browse"},
            {"name": "watch_page", "path": "/watch/1"},
            {"name": "broadcast_page", "path": "/broadcast"},
            {"name": "wallet_page", "path": "/wallet"},
        ]

        base_url = "http://localhost:5173"

        for route in routes:
            url = f"{base_url}{route['path']}"
            print(f"Navigating to {url}...")

            try:
                # Use wait_until="domcontentloaded" instead of "networkidle" for Watch page if it's timing out
                # This is because streams might keep connections open or retry, causing networkidle to never fire.
                wait_strategy = "domcontentloaded" if route['name'] == 'watch_page' else "networkidle"

                page.goto(url, wait_until=wait_strategy, timeout=60000)

                # Manual delay for animations/render settlement
                time.sleep(3)

                # Check for successful load visually
                # For watch page, maybe just wait for the main layout container if specific elements fail
                if route['name'] == 'watch_page':
                    try:
                        page.wait_for_selector('h1', timeout=5000)
                    except:
                        pass # proceed to screenshot anyway

                output_path = f"screenshots/{route['name']}.png"
                page.screenshot(path=output_path)
                print(f"Captured {output_path}")

            except Exception as e:
                print(f"Error capturing {route['name']}: {e}")

        browser.close()
        print("Screenshot generation complete.")

if __name__ == "__main__":
    generate_screenshots()
