var Project_user = require("../models/project_user");
var winston = require('../config/winston');

const BATCH_SIZE = 100;

const AGENT_ROLES_FILTER = {
  $or: [
    { role: 'agent' },
    { role: 'supervisor' },
    { role: 'admin' },
    { role: 'owner' }
  ]
};

const USER_ROLES_FILTER = {
  $or: [{ role: 'user' }, { role: 'guest' }]
};

async function batchSetRoleType(filter, roleType) {
  let modified = 0;
  const cursor = Project_user.find(filter).select('_id').lean().cursor();
  let batch = [];
  for await (const doc of cursor) {
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { roleType } }
      }
    });
    if (batch.length >= BATCH_SIZE) {
      const result = await Project_user.bulkWrite(batch);
      modified += result.modifiedCount;
      batch = [];
    }
  }
  if (batch.length > 0) {
    const result = await Project_user.bulkWrite(batch);
    modified += result.modifiedCount;
  }
  return modified;
}

/**
 * Make any changes you need to make to the database here
 */
async function up() {
  try {
    winston.info('[project_user_role_type] Setting roleType=1 for agent roles (batched)...');
    const agentsModified = await batchSetRoleType(AGENT_ROLES_FILTER, 1);
    winston.info(`[project_user_role_type] Schema updated for ${agentsModified} project_user of type agents`);

    winston.info('[project_user_role_type] Setting roleType=2 for user/guest roles (batched)...');
    const usersModified = await batchSetRoleType(USER_ROLES_FILTER, 2);
    winston.info(`[project_user_role_type] Schema updated for ${usersModified} project_user of type user`);
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
