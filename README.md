# OVH DNS API Client for Certbot
Certbot plugin to respond to DNS-01 challenges by updating the DNS zone in an OVH account.

## Why
There are several use cases for DNS challenge with **Certbot**, for example when the server or machine that need a
certificate is not directly accessible from the internet. This way, you can secure machines and services in your
internal network, behind a firewall or VPN. Other use cases could be automating multi-server deploys.

## Prerequisites
- [Node JS](https://nodejs.org/) ≥ 6.
- [Certbot](https://certbot.eff.org).

## How to Use
0. Download or clone this repo, and then from a terminal enter the directory: `cd ovh-certbot-dns` and run `npm install`.

1. Get an _App Key_ and _App Secret_ from OVH by registering a new app at this URL:
[OVH Developers: Create App](https://eu.api.ovh.com/createApp/)
(see more details here: [First Steps with the API - OVH](https://api.ovh.com/g934.first_step_with_api)).

2. Obtain a _Consumer Key_ (aka Authentication Token) by running the included script in a terminal:  
`node bin/authorize.js --endpoint=ovh-eu --app_key=yourappkey --app_secret=yourappsecret`  
by replacing "yourappkey" and "yourappsecret" with the values you received in the previous step, and optionally using a
different endpoint than "ovh-eu".

3. You will get a response with an URL:  
`{ validationUrl: 'https://eu.api.ovh.com/auth/?credentialToken=jed...',
  consumerKey: '69X...',
  state: 'pendingValidation' }`  
Visit the `validationUrl` and login with the account with the DNS zone to be updated, and select a suitable _Valitidy_
(it would make sense to use Unlimited, unless for testing purposes). The `consumerKey` that you received with the
`validationURL` will now be authorized to access your account.

4. Copy the file `.env.example` to `.env`, and fill the values that you received from OVH.
As endpoint, the default value is `ovh-eu`.

5. Now you're ready to setup **Certbot**! You can run the following command:  
`sudo certbot certonly --manual --preferred-challenges=dns --manual-auth-hook '/path/to/ovh-certbot-dns/bin/create-record.js' --manual-cleanup-hook '/path/to/ovh-certbot-dns/bin/delete-record.js' -d www.example.com`.  
This command will wait for up to 60 seconds (or more if you raise the value `DNS_TIMEOUT` in your `.env` file).

6. If everything goes right, you will get a certificate! It will be saved at `/etc/letsencrypt/live/www.example.com/fullchain.pem`.
You can add it your webserver configuration or copy to another server if you need to.

7. Now, automate! You can add the line `@weekly certbot renew --quiet` to your crontab, for example: `sudo crontab -e`.
If you're using a webserver like Nginx, this line could be `@weekly certbot renew --quiet && systemctl restart nginx.service`.

**NB**: the `certbot renew` command uses the same options as the `certbot certonly` command, so please do not move or delete
the `ovh-certbot-dns` directory.

## See Also
https://github.com/ovh/node-ovh

## Author
David Gasperoni

## License
MIT
