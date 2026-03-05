## 2026-03-01 - Adding comprehensive UI component tests
**Learning:** Adding test files specific to a component allows ensuring that various UI variations load correctly in a localized context. Mocks can simulate states to cover components effectively without complex test setups.
**Action:** When working on tests, make sure to consider states such as connection loss and poor latency for components dealing with sockets.
## 2026-03-02 - Added test coverage to TipButton.jsx
**Learning:** Added unit test coverage for the `TipButton.jsx` to ensure happy and error path works appropriately. Mocked `useP2PSettings` from `../context/P2PContext` to support authentication testing.
**Action:** Always write unit test coverage to ensure critical flows have automated regression testing.
## 2026-03-04 - Add missing useP2PStream test
**Learning:** Testing custom React hooks that interact heavily with WebRTC APIs and socket connections requires careful isolation. When mocking `RTCPeerConnection`, assigning classes directly to `globalThis` instead of `global` avoids ESLint `no-undef` errors. Additionally, testing socket listener cleanup correctly requires intercepting the mocked callback and awaiting internal promises before asserting component unmount effects.
**Action:** When writing tests that mock browser globals in Vitest, explicitly use `globalThis`. Always cleanly encapsulate event listener callbacks with mock implementations so they can be simulated dynamically during testing.
## 2026-03-05 - Added test for poll with duration
**Learning:** When using Vitest fake timers (`vi.useFakeTimers()`) to test React components that update state via intervals or timeouts, wrap `vi.advanceTimersByTime()` calls inside `act()` from `@testing-library/react` to prevent 'act(...)' warnings and ensure DOM updates are reflected for assertions.
**Action:** Always wrap `vi.advanceTimersByTime()` in `act()` when testing components that rely on timeouts/intervals.
