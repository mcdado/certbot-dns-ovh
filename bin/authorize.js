#!/usr/bin/env node

require('dotenv').config();

const argv = require('minimist')(process.argv.slice(2));

const ovh = require('ovh')({
  endpoint: argv.endpoint || process.env.OVH_ENDPOINT || 'ovh-eu',
  appKey: argv.app_key || process.env.OVH_APP_KEY,
  appSecret: argv.app_secret || process.env.OVH_APP_SECRET
});

ovh.request('POST', '/auth/credential', {
  accessRules: [
    { method: 'GET', path: '/domain/zone/*' },
    { method: 'POST', path: '/domain/zone/*' },
    { method: 'PUT', path: '/domain/zone/*' },
    { method: 'DELETE', path: '/domain/zone/*/record/*' }
  ]
}, (error, credential) => {
  console.log(error || credential);
});
