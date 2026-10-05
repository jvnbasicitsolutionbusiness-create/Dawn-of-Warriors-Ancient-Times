// Cross-platform production entry point (also works from Windows terminals).
process.env.NODE_ENV = "production";
await import("./index.js");
