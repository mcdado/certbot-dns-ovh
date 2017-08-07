#!/usr/bin/env node

require('dotenv').config();

const argv = require('minimist')(process.argv.slice(2));

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  consumerKey: argv.key || process.env.OVH_CUSTOMER_KEY,
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET,
});

ovh.request('GET', '/me', (err, me) => {
  console.log(err || me);
});
