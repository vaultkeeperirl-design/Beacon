import asyncio
from playwright.async_api import async_playwright
import os
import json
import argparse

async def run(config_path, base_url_override=None, output_dir=None):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Set a standard desktop viewport
        await page.set_viewport_size({"width": 1920, "height": 1080})

        # Determine output directory
        out_dir = output_dir or "screenshots"

        # Ensure screenshots directory exists
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        # Load configuration
        try:
            with open(config_path, "r") as f:
                config = json.load(f)
        except Exception as e:
            print(f"Error loading config from {config_path}: {e}")
            return

        # Determine base URL
        # Priority: Command line > Environment variable > Config file
        base_url = base_url_override or os.environ.get("SCREENSHOT_BASE_URL") or config.get("base_url", "http://localhost:5173")
        base_url = base_url.rstrip("/")

        for item in config.get("screenshots", []):
            filename = item.get("filename")
            path = item.get("path", "/")
            url = f"{base_url}{path}"
            print(f"Taking screenshot for {url}...")
            try:
                # Use wait_until from config if provided, otherwise default to networkidle
                wait_cond = item.get("wait_until", "networkidle")

                # Go to the URL
                await page.goto(url, wait_until=wait_cond, timeout=60000)

                # Wait a bit extra for any React mounting or animations
                await page.wait_for_timeout(3000)

                await page.screenshot(path=f"{out_dir}/{filename}", full_page=True)
                print(f"Saved to {out_dir}/{filename}")
            except Exception as e:
                print(f"Error taking screenshot for {url}: {e}")

        await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate screenshots for Beacon.")
    parser.add_argument("--config", default="screenshots_config.json", help="Path to the configuration file.")
    parser.add_argument("--base-url", help="Override the base URL.")
    parser.add_argument("--output-dir", help="Override the output directory.")
    args = parser.parse_args()

    asyncio.run(run(args.config, args.base_url, args.output_dir))
