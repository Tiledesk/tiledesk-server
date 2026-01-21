#!/usr/bin/env node
/**
 * Migration: Normalize preflight field in requests collection
 * 
 * This migration ensures all request documents have the preflight field explicitly set.
 * This improves MongoDB query efficiency and index utilization.
 * 
 * Purpose:
 * - Set preflight: false as default for documents where it's not set or is missing
 * - Enables use of simpler, more efficient index patterns
 * - Replaces the need for $or conditions with $exists checks
 * 
 * Usage:
 * node migrations/migrate_preflight_field.js
 * 
 * Rollback:
 * node migrations/migrate_preflight_field.js --rollback
 */

const mongoose = require('mongoose');
const winston = require('../config/winston');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    winston.info('Connected to MongoDB');
    return performMigration();
  })
  .catch(err => {
    winston.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

async function performMigration() {
  try {
    const isRollback = process.argv.includes('--rollback');
    
    if (isRollback) {
      await rollback();
    } else {
      await migrate();
    }
    
    winston.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    winston.error('Migration failed:', error);
    process.exit(1);
  }
}

async function migrate() {
  const db = mongoose.connection.db;
  const requestsCollection = db.collection('requests');

  winston.info('Starting preflight field normalization...');

  // Count documents that need migration
  const countMissing = await requestsCollection.countDocuments({
    $or: [
      { preflight: { $exists: false } },
      { preflight: null }
    ]
  });

  winston.info(`Found ${countMissing} documents with missing or null preflight field`);

  if (countMissing === 0) {
    winston.info('No documents need migration');
    return;
  }

  // Update documents in batches
  const batchSize = 10000;
  let processed = 0;
  
  while (processed < countMissing) {
    const result = await requestsCollection.updateMany(
      {
        $or: [
          { preflight: { $exists: false } },
          { preflight: null }
        ]
      },
      {
        $set: { preflight: false }
      },
      { 
        multi: true,
        limit: batchSize
      }
    );

    processed += result.modifiedCount;
    winston.info(`Processed ${processed}/${countMissing} documents`);
  }

  winston.info('Preflight normalization completed');
  winston.info('Building indexes after migration...');

  // Reindex the collection
  await requestsCollection.reIndex();
  winston.info('Indexes rebuilt successfully');
}

async function rollback() {
  const db = mongoose.connection.db;
  const requestsCollection = db.collection('requests');

  winston.info('Rolling back preflight field normalization...');

  // Remove preflight field from all documents to return to original state
  const result = await requestsCollection.updateMany(
    { preflight: false },
    { $unset: { preflight: "" } }
  );

  winston.info(`Removed preflight field from ${result.modifiedCount} documents`);
  winston.info('Rollback completed');
}
