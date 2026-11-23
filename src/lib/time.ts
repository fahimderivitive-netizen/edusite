// Server-side wall clock for dynamic pages (kept out of component bodies to satisfy the purity lint).
export const nowMs = () => Date.now();
