import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registerPath = '.agent/state/rejected_route_register.json';
const currentPath = '.agent/state/current.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function existsRelative(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function unique(values) {
  return [...new Set(values)];
}

const errors = [];
const warnings = [];

const register = readJson(registerPath);
const current = readJson(currentPath);
const activeCaseFile = current.activeCaseFile || current.active_case_file;

if (!Array.isArray(register.routes) || register.routes.length === 0) {
  errors.push(`${registerPath}: routes must be a non-empty array.`);
}

const routeIds = new Set();
for (const route of register.routes || []) {
  for (const field of [
    'routeId',
    'pageOrObject',
    'purpose',
    'result',
    'whyRejectedOrParked',
    'riskIfRepeated',
    'status'
  ]) {
    if (!route[field]) errors.push(`${registerPath}: route ${route.routeId || '<missing>'} is missing ${field}.`);
  }
  if (!Array.isArray(route.attemptOrRun) || route.attemptOrRun.length === 0) {
    errors.push(`${registerPath}: route ${route.routeId || '<missing>'} must list attemptOrRun.`);
  }
  if (!Array.isArray(route.evidenceLinks) || route.evidenceLinks.length === 0) {
    errors.push(`${registerPath}: route ${route.routeId || '<missing>'} must list evidenceLinks.`);
  }
  if (!Array.isArray(route.repeatAllowedOnlyIf) || route.repeatAllowedOnlyIf.length === 0) {
    errors.push(`${registerPath}: route ${route.routeId || '<missing>'} must list repeatAllowedOnlyIf.`);
  }
  if (route.routeId) {
    if (routeIds.has(route.routeId)) errors.push(`${registerPath}: duplicate routeId ${route.routeId}.`);
    routeIds.add(route.routeId);
  }
  for (const link of route.evidenceLinks || []) {
    if (/^https?:\/\//i.test(link)) continue;
    if (!existsRelative(link)) errors.push(`${registerPath}: evidence link missing for ${route.routeId}: ${link}`);
  }
}

let activeCase = null;
if (!activeCaseFile) {
  warnings.push(`${currentPath}: no activeCaseFile/active_case_file field; rejected-route case review skipped.`);
} else if (!existsRelative(activeCaseFile)) {
  errors.push(`${currentPath}: active case file does not exist: ${activeCaseFile}`);
} else {
  activeCase = readJson(activeCaseFile);
}

if (activeCase) {
  const review = activeCase.rejectedRouteReview;
  if (!review) {
    warnings.push(`${activeCaseFile}: no rejectedRouteReview block. Add one when a planned route touches known rejected BC surfaces.`);
  } else {
    if (review.checkedRegister !== registerPath) {
      errors.push(`${activeCaseFile}: rejectedRouteReview.checkedRegister must be ${registerPath}.`);
    }
    const blockedRouteIds = review.blockedRouteIds || review.routeIds || [];
    if (!Array.isArray(blockedRouteIds)) {
      errors.push(`${activeCaseFile}: rejectedRouteReview.blockedRouteIds must be an array when present.`);
    }
    for (const routeId of blockedRouteIds || []) {
      if (!routeIds.has(routeId)) errors.push(`${activeCaseFile}: unknown rejected route ${routeId}.`);
    }
    if ((blockedRouteIds || []).length > 0) {
      if (!Array.isArray(review.materiallyDifferentBecause) || review.materiallyDifferentBecause.length === 0) {
        errors.push(`${activeCaseFile}: planned route references rejected routes but does not document materiallyDifferentBecause.`);
      }
      if (!Array.isArray(review.repeatAllowedBecause) || review.repeatAllowedBecause.length === 0) {
        errors.push(`${activeCaseFile}: planned route references rejected routes but does not document repeatAllowedBecause.`);
      }
    }
    const duplicateIds = unique(blockedRouteIds || []);
    if (duplicateIds.length !== (blockedRouteIds || []).length) {
      errors.push(`${activeCaseFile}: rejectedRouteReview.blockedRouteIds contains duplicates.`);
    }
  }
}

const payload = {
  ok: errors.length === 0,
  register: registerPath,
  activeCase: current.activeCase,
  activeCaseFile: activeCaseFile || null,
  routeCount: register.routes?.length || 0,
  warnings,
  errors
};

console.log(JSON.stringify(payload, null, 2));

if (errors.length > 0) process.exit(1);
