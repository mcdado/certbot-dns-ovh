#!/usr/bin/env node

require('dotenv').config();

const dns = require('dns');
const argv = require('minimist')(process.argv.slice(2));
const parseDomain = require('parse-domain');

const certbotDomain = process.env.CERTBOT_DOMAIN;
const certbotValidation = process.env.CERTBOT_VALIDATION;

const dom = parseDomain(certbotDomain);

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT,
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

ovh.request('POST', `/domain/zone/${dom.domain}.${dom.tld}/record`, {
  fieldType: 'TXT',
  subDomain: `_acme-challenge.${dom.subdomain}`,
  target: certbotValidation,
  ttl: 1,
}, (recordErr, recordRes) => {
  if (recordErr) {
    console.error(recordErr);
    process.exit(1);
  }

  ovh.request('POST', `/domain/zone/${dom.domain}.${dom.tld}/refresh`, (refreshErr, refreshRes) => {
    if (refreshErr) {
      console.error(refreshErr);
      process.exit(1);
    }

    const timer = setInterval(() => {
      dns.resolveTxt(`_acme-challenge.${dom.subdomain}.${dom.domain}.${dom.tld}`, (errResolve, records) => {
        if (records.length > 0) {
          clearInterval(timer);
          process.exit(0);
        }
      });
    }, 5000);

    setTimeout(() => {
      clearInterval(timer);
      process.exit(0);
    }, Number(process.env.DNS_TIMEOUT || 0) * 1000|| 60000);
  });
});
