#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

// Upload mp4 assets to Cloudflare R2 using S3-compatible API.
// Usage:
//   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... node scripts/upload-r2.js <dir1> <dir2> ...

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const requiredEnv = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
}

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const inputDirs = process.argv.slice(2);
if (!inputDirs.length) {
  console.error("Usage: node scripts/upload-r2.js <dir1> <dir2> ...");
  process.exit(1);
}

const listFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp4")) {
      files.push(full);
    }
  }
  return files;
};

const uploadFile = async (fullPath, key) => {
  const body = fs.readFileSync(fullPath);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "video/mp4",
  }));
  console.log(`Uploaded: ${key}`);
};

(async () => {
  for (const dir of inputDirs) {
    const stats = fs.statSync(dir);
    if (!stats.isDirectory()) continue;
    const files = listFiles(dir);
    for (const file of files) {
      const key = path.basename(file);
      await uploadFile(file, key);
    }
  }
})();
