var Project_user = require("../models/project_user");
var winston = require('../config/winston');

const BATCH_SIZE = 100;
/** Log a progress line every this many bulkWrite rounds (plus always after the 1st). */
const PROGRESS_LOG_EVERY_BATCHES = 10;

/** Only documents that still need roleType (idempotent re-runs). */
const WITHOUT_ROLE_TYPE = {
  $or: [{ roleType: { $exists: false } }, { roleType: null }]
};

const AGENT_ROLES_FILTER = {
  $and: [
    {
      $or: [
        { role: 'agent' },
        { role: 'supervisor' },
        { role: 'admin' },
        { role: 'owner' }
      ]
    },
    WITHOUT_ROLE_TYPE
  ]
};

const USER_ROLES_FILTER = {
  $and: [{ $or: [{ role: 'user' }, { role: 'guest' }] }, WITHOUT_ROLE_TYPE]
};

async function batchSetRoleType(filter, roleType, phaseLabel) {
  const totalMatching = await Project_user.countDocuments(filter);
  const started = Date.now();
  winston.info(
    `[project_user_role_type] ${phaseLabel}: ${totalMatching} documents match filter; streaming _id + bulkWrite in chunks of ${BATCH_SIZE}`
  );

  let modified = 0;
  let scanned = 0;
  let bulkRounds = 0;
  const cursor = Project_user.find(filter).select('_id').lean().cursor();
  let batch = [];

  function logProgress(reason) {
    const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
    winston.info(
      `[project_user_role_type] ${phaseLabel} ${reason}: scanned=${scanned}/${totalMatching}, modifiedThisPhase=${modified}, ${elapsedSec}s elapsed`
    );
  }

  for await (const doc of cursor) {
    scanned++;
    batch.push({
      updateOne: {
        filter: { _id: doc._id, ...WITHOUT_ROLE_TYPE },
        update: { $set: { roleType } }
      }
    });
    if (batch.length >= BATCH_SIZE) {
      const result = await Project_user.bulkWrite(batch);
      modified += result.modifiedCount;
      batch = [];
      bulkRounds++;
      if (bulkRounds === 1 || bulkRounds % PROGRESS_LOG_EVERY_BATCHES === 0) {
        logProgress(`progress (bulk round ${bulkRounds})`);
      }
    }
  }
  if (batch.length > 0) {
    const result = await Project_user.bulkWrite(batch);
    modified += result.modifiedCount;
    bulkRounds++;
    logProgress(`final partial batch (bulk round ${bulkRounds})`);
  }

  logProgress('phase complete');
  return modified;
}

/**
 * Make any changes you need to make to the database here
 */
async function up() {
  try {
    const agentsModified = await batchSetRoleType(AGENT_ROLES_FILTER, 1, 'agents roleType=1');
    winston.info(`[project_user_role_type] Agents phase done: ${agentsModified} documents modified`);

    const usersModified = await batchSetRoleType(USER_ROLES_FILTER, 2, 'users/guest roleType=2');
    winston.info(`[project_user_role_type] Users/guest phase done: ${usersModified} documents modified`);
  } catch (err) {
    winston.error('[project_user_role_type] Error applying migration:', err);
    throw err;
  }
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
  // Write migration here
  // console.log("down*********");
}

module.exports = { up, down };
