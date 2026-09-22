import "@testing-library/jest-dom";

// Date-based formatting (lib/format.ts) reads the local timezone; pin it so
// tests are deterministic regardless of the machine/CI running them.
process.env.TZ = "UTC";
