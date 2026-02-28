from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to home page...")
        page.goto("http://localhost:5173/")
        time.sleep(2)

        print("Navigating to registration...")
        page.click("text=Sign Up")
        time.sleep(1)

        print("Registering new user...")
        username = "e2e_test_user_" + str(int(time.time()))
        page.fill("input[placeholder='Choose a username']", username)
        page.fill("input[placeholder='Create a strong password']", "password123")
        page.fill("input[placeholder='Confirm your password']", "password123")
        page.click("button:has-text('Create Account')")
        time.sleep(2)

        print("Checking if logged in successfully...")
        # Verify the user is redirected and can see the "Go Live" button or their profile icon
        page.wait_for_selector("text=Go Live")

        # Click on Go Live to go to Broadcast page
        page.click("text=Go Live")
        time.sleep(2)

        print("Checking Co-Streaming UI elements...")
        # Verify the co-streaming section and split default
        page.wait_for_selector("text=Co-Streaming & Revenue Splits")
        page.wait_for_selector("text=100%")

        print("Taking final screenshot...")
        page.screenshot(path="screenshots/auth_wallet_flow.png")
        print("Done.")

        browser.close()

if __name__ == "__main__":
    run()