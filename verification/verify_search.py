from playwright.sync_api import sync_playwright

def verify_search_flow():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Navigate to home page
            print("Navigating to home page...")
            page.goto("http://localhost:5173")

            # Wait for content to load
            print("Waiting for 'Featured Stream' text...")
            page.wait_for_selector('text=Featured Stream')
            print("Home page loaded.")

            # 2. Perform Search
            print("Performing search for 'coding'...")
            search_input = page.get_by_placeholder("Search streams...")
            search_input.fill("coding")
            search_input.press("Enter")

            # 3. Verify Search Results Page
            print("Waiting for search results...")
            # Should see "Search Results for "coding""
            page.wait_for_selector('text=Search Results for "coding"')

            # Should see at least one result (JulesDev stream has "coding" tag)
            page.wait_for_selector('text=Building a P2P streaming app from scratch')

            print("Search results verified. Taking screenshot...")
            page.screenshot(path="verification/search_results.png")

            # 4. Perform Empty Search
            print("Performing search for non-existent stream...")
            search_input.fill("nonexistentstream12345")
            search_input.press("Enter")

            # 5. Verify Empty State
            print("Waiting for empty state...")
            page.wait_for_selector('text=No channels found')

            # Use a more generic selector for the button if text matching is tricky
            # or ensure exact text match.
            clear_btn = page.locator('button', has_text="Clear Search")
            clear_btn.wait_for()

            print("Empty state verified. Taking screenshot...")
            page.screenshot(path="verification/search_empty.png")

            # 6. Test Clear Search
            print("Testing Clear Search button...")
            clear_btn.click()

            # Should return to "Live Channels"
            # Note: Browse.jsx renders "Live Channels" when query is empty.
            page.wait_for_selector('text=Live Channels')
            print("Clear search verified.")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_search_flow()
