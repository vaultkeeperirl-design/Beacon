import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Set a standard desktop viewport
        await page.set_viewport_size({"width": 1920, "height": 1080})

        # Ensure screenshots directory exists
        if not os.path.exists("screenshots"):
            os.makedirs("screenshots")

        urls = {
            "home_page.png": "http://localhost:5173/",
            "watch_page.png": "http://localhost:5173/watch/1",
            "broadcast_page.png": "http://localhost:5173/broadcast",
            "wallet_page.png": "http://localhost:5173/wallet",
            "following_page.png": "http://localhost:5173/following"
        }

        for filename, url in urls.items():
            print(f"Taking screenshot for {url}...")
            try:
                wait_cond = "networkidle"
                # For watch page, network might never be idle due to streaming/p2p attempts
                if "watch" in url:
                    wait_cond = "domcontentloaded"

                # Go to the URL
                await page.goto(url, wait_until=wait_cond, timeout=60000)

                # Wait a bit extra for any React mounting or animations
                await page.wait_for_timeout(3000)

                await page.screenshot(path=f"screenshots/{filename}", full_page=True)
                print(f"Saved to screenshots/{filename}")
            except Exception as e:
                print(f"Error taking screenshot for {url}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
