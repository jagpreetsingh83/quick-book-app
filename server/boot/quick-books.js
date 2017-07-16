'use strict';

const QuickBooks = require('node-quickbooks');
const request = require('request');
const qs = require('querystring');
const app = require('../server');

module.exports = app => {
  const qbConfig = app.get('qb');
  const consumerKey = qbConfig.consumerKey;
  const consumerSecret = qbConfig.consumerSecret;
  const companyId = qbConfig.companyId;
  app.get('/authenticate', (req, res) => {
    var postBody = {
      url: QuickBooks.REQUEST_TOKEN_URL,
      oauth: {
        'callback': 'http://localhost:' + app.get('port') + '/callback',
        'consumer_key': consumerKey,
        'consumer_secret': consumerSecret,
      },
    };
    request.post(postBody, (error, response, body) => {
      const requestToken = qs.parse(body);
      req.session['oauth_token_secret'] = requestToken.oauth_token_secret;
      res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token);
    });
  });
  app.get('/callback', (req, res) => {
    const postBody = {
      url: QuickBooks.ACCESS_TOKEN_URL,
      oauth: {
        'consumer_key': consumerKey,
        'consumer_secret': consumerSecret,
        'token': req.query.oauth_token,
        'token_secret': req.session.oauth_token_secret,
        'verifier': req.query.oauth_verifier,
        'realmId': req.query.realmId,
      },
    };
    request.post(postBody, (error, response, body) => {
      let accessToken = qs.parse(body);
      console.log(body);
      res.json(body);
    });
  });
};
