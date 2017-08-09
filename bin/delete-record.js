#!/usr/bin/env node

require('dotenv').config();

const argv = require('minimist')(process.argv.slice(2));
const parseDomain = require('parse-domain');

const certbotDomain = process.env.CERTBOT_DOMAIN;

const dom = parseDomain(certbotDomain);

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

ovh.request('GET', `/domain/zone/${dom.domain}.${dom.tld}/record`, {
  fieldType: 'TXT',
  subDomain: `_acme-challenge.${dom.subdomain}`,
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

    process.exit(0);
  });
});
