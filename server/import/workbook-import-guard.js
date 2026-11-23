"use strict";

const MAX_CONCURRENT_IMPORTS = 2;
let activeImports = 0;

function acquireWorkbookImport() {
  if (activeImports >= MAX_CONCURRENT_IMPORTS) return null;
  activeImports += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeImports = Math.max(0, activeImports - 1);
  };
}

module.exports = { acquireWorkbookImport, MAX_CONCURRENT_IMPORTS };
