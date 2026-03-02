## 2026-03-01 - Adding comprehensive UI component tests
**Learning:** Adding test files specific to a component allows ensuring that various UI variations load correctly in a localized context. Mocks can simulate states to cover components effectively without complex test setups.
**Action:** When working on tests, make sure to consider states such as connection loss and poor latency for components dealing with sockets.
## 2026-03-02 - Added test coverage to TipButton.jsx
**Learning:** Added unit test coverage for the `TipButton.jsx` to ensure happy and error path works appropriately. Mocked `useP2PSettings` from `../context/P2PContext` to support authentication testing.
**Action:** Always write unit test coverage to ensure critical flows have automated regression testing.
