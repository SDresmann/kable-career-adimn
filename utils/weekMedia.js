const path = require('path');
const fs = require('fs');

/** Avoid repeated sync stat on every media request (paths are stable per deploy). */
const pathCache = new Map();

/**
 * @param {number} weekId
 * @param {'video' | 'audio'} subdir
 * @param {string} filename
 * @returns {string | null} absolute path, or null if not found
 */
function resolveWeekMediaPath(weekId, subdir, filename) {
  const key = `${weekId}/${subdir}/${filename}`;
  if (pathCache.has(key)) {
    return pathCache.get(key);
  }

  const repoRoot = path.join(__dirname, '..', '..');
  const candidates = [
    path.join(__dirname, '..', 'media', `Week${weekId}`, subdir, filename),
    path.join(repoRoot, 'public', `Week${weekId}`, subdir, filename),
    path.join(repoRoot, 'src', `Week${weekId}`, subdir, filename),
  ];

  let found = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      found = p;
      break;
    }
  }

  if (!found) {
    pathCache.set(key, null);
    return null;
  }

  const resolved = path.resolve(found);
  pathCache.set(key, resolved);
  return resolved;
}

module.exports = { resolveWeekMediaPath };
