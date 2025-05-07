// This is a workaround for React Refresh runtime
// It imports the actual runtime from node_modules and re-exports it

// All modules will import this file instead of the one in node_modules
// which avoids the "import outside of src" error

// Import original runtime using relative path that works in src/
const runtime = require('../node_modules/react-refresh/runtime');

// Re-export everything
module.exports = runtime;
