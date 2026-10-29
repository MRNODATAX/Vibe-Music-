/**
 * jsdom shims for browser APIs the app touches at module scope or on mount.
 */

class MockMediaQueryList {
  matches = false;
  media = "";
  onchange = null;
  addEventListener() {}
  removeEventListener() {}
  addListener() {}
  removeListener() {}
  dispatchEvent() {
    return false;
  }
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const mql = new MockMediaQueryList();
    mql.media = query;
    mql.matches = false;
    return mql as unknown as MediaQueryList;
  },
});

if (!window.HTMLMediaElement.prototype.play) {
  // no-op; jsdom already defines these but they throw "not implemented"
}
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => undefined;

Object.defineProperty(window, "scrollTo", { writable: true, value: () => undefined });
Element.prototype.scrollTo = () => undefined;
Element.prototype.scrollBy = () => undefined;
