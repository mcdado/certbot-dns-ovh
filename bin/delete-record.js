#!/usr/bin/env node

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const parseDomain = require('parse-domain');

const env = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: env });

const certbotDomain = process.env.CERTBOT_DOMAIN;

const dom = parseDomain(certbotDomain);
const record = dom.subdomain ? `_acme-challenge.${dom.subdomain}` : '_acme-challenge';

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

ovh.request('GET', `/domain/zone/${dom.domain}.${dom.tld}/record`, {
  fieldType: 'TXT',
  subDomain: `${record}`,
}, (recordErr, recordRes) => {
  if (recordErr) {
    console.error(recordErr);
    process.exit(1);
  }

  if (recordRes < 1) {
    process.exit(0);
  }

  ovh.request('DELETE', `/domain/zone/${dom.domain}.${dom.tld}/record/${recordRes[0]}`, (deleteErr, deleteRes) => {
    if (deleteErr) {
      console.error(deleteErr);
      process.exit(2);
    }
  });

  ovh.request('POST', `/domain/zone/${dom.domain}.${dom.tld}/refresh`, (refreshErr) => {
    if (refreshErr) {
      console.error(refreshErr);
      process.exit(3);
    }
  });

  process.exit(0);
});
