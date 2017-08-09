#!/usr/bin/env node

require('dotenv').config();

const dns = require('dns');
const bluebird = require('bluebird');
const argv = require('minimist')(process.argv.slice(2));
const parseDomain = require('parse-domain');

const certbotDomain = process.env.CERTBOT_DOMAIN;
const certbotValidation = process.env.CERTBOT_VALIDATION;

const dom = parseDomain(certbotDomain);
const domain = dom && dom.domain !== '' && dom.tld !== '' ? `${dom.domain}.${dom.tld}` : '';
const subdomain = dom && dom.subdomain ? dom.subdomain : '';

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

const resolveDNS = new Promise((resolvePromise, rejectPromise) => {
  dns.resolveNs(domain, (errResolve, records) => {
    if (errResolve) {
      rejectPromise(errResolve);
      throw errResolve;
    }

    bluebird.map(records, (record) => {
      return new Promise((dnsResolve, dnsReject) => {
        dns.resolve(record, (err, ip) => {
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
    subDomain: `_acme-challenge.${subdomain}`,
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
        dns.resolveTxt(`_acme-challenge.${subdomain}.${domain}`, (errResolve, records) => {
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
