#!/usr/bin/env node

const path = require('path');
const dns = require('dns');
const bluebird = require('bluebird');
const argv = require('minimist')(process.argv.slice(2));
const parseDomain = require('parse-domain');

const env = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: env });

const certbotDomain = process.env.CERTBOT_DOMAIN;
const certbotValidation = process.env.CERTBOT_VALIDATION;

const dom = parseDomain(certbotDomain);
const domain = dom && dom.domain !== '' && dom.tld !== '' ? `${dom.domain}.${dom.tld}` : '';
const record = dom && dom.subdomain ? `_acme-challenge.${dom.subdomain}` : '_acme-challenge';

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

const resolveDNS = new Promise((resolvePromise, rejectPromise) => {
  dns.resolveNs(domain, (errResolve, dnsRecords) => {
    if (errResolve) {
      rejectPromise(errResolve);
      throw errResolve;
    }

    bluebird.map(dnsRecords, (dnsRecord) => {
      return new Promise((dnsResolve, dnsReject) => {
        dns.resolve(dnsRecord, (err, ip) => {
          if (err) {
            dnsReject(err);
          } else {
            dnsResolve(ip.length ? ip[0] : null);
          }
        });
      });
    }).then((dnsList) => {
      const ipList = dnsList.filter((server) => server !== null);
      resolvePromise(ipList);
    }).catch((reason) => {
      rejectPromise(reason);
    });
  });
});

resolveDNS.then((servers) => {
  dns.setServers(servers);
  ovh.request('POST', `/domain/zone/${domain}/record`, {
    fieldType: 'TXT',
    subDomain: `${record}`,
    target: certbotValidation,
    ttl: 1,
  }, (recordErr) => {
    if (recordErr) {
      console.error(recordErr);
      process.exit(1);
    }

    ovh.request('POST', `/domain/zone/${domain}/refresh`, (refreshErr) => {
      if (refreshErr) {
        console.error(refreshErr);
        process.exit(1);
      }

      const timer = setInterval(() => {
        dns.resolveTxt(`${record}.${domain}`, (errResolve, records) => {
          if (records && records.length > 0) {
            clearInterval(timer);
            process.exit(0);
          }
        });
      }, 5000);

      setTimeout(() => {
        clearInterval(timer);
        process.exit(0);
      }, Number(process.env.DNS_TIMEOUT || 0) * 1000 || 60000);
    });
  });
});
