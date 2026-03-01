from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to home page...")
        # Note: Port might be 5173 or 5174 depending on previous runs
        # Try 5173 first
        try:
            page.goto("http://localhost:5173/")
        except:
            page.goto("http://localhost:5174/")

        time.sleep(2)

        print("Navigating to a stream page...")
        # Since MOCK_STREAMS has 'JulesDev', we can try going there directly
        page.goto(page.url + "watch/JulesDev")
        time.sleep(3)

        print("Checking for Tip button...")
        tip_button = page.get_by_role("button", name="Tip")
        if tip_button.is_visible():
            print("Tip button is visible.")
            tip_button.click()
            time.sleep(1)

            print("Checking if Tip dropdown opened...")
            expect_text = "Support JulesDev"
            if page.get_by_text(expect_text).is_visible():
                print(f"'{expect_text}' is visible.")
            else:
                print(f"'{expect_text}' is NOT visible.")
        else:
            print("Tip button is NOT visible.")

        print("Taking screenshot of Watch page with Tip dropdown...")
        page.screenshot(path="verification_tip_button.png")
        print("Done.")

        browser.close()

if __name__ == "__main__":
    run()