import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrollTo; silence its 'not implemented' noise.
window.scrollTo = (() => {}) as typeof window.scrollTo
