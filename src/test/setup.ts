import "@testing-library/jest-dom";

if (typeof URL.createObjectURL !== "function") {
  // jsdom does not implement createObjectURL/revokeObjectURL
  (URL as any).createObjectURL = () => "blob:mock";
  (URL as any).revokeObjectURL = () => {};
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
