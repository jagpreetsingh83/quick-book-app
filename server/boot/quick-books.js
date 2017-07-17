'use strict';

const QuickBooks = require('node-quickbooks');
const request = require('request');
const qs = require('querystring');

module.exports = app => {

  const qbConfig = app.get('qb');
  const consumer_key = qbConfig.consumerKey;
  const consumer_secret = qbConfig.consumerSecret;

  /**
   * This route authenticates the application with the Quick Books.
   * A callback URL is provided for the Quick Book to revert with oauth token and secret.
   *
   * @param  {string} /authenticate - Route
   * @param  {object} req - HttpRequest
   * @param  {object} res - HttpResponse
   */
  app.get('/authenticate', (req, res) => {
    var postBody = {
      url: QuickBooks.REQUEST_TOKEN_URL,
      oauth: {
        callback: `${req.protocol}://${req.hostname}:${app.get('port')}/callback`,
        consumer_key,
        consumer_secret
      }
    };
    request.post(postBody, (error, response, body) => {
      const requestToken = qs.parse(body);
      req.session.oauth_token_secret = requestToken.oauth_token_secret;
      res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token);
    });
  });

  /**
   * This callback is used to receive the oauth token and secret from the Quick Book.
   *
   * @param  {string} '/callback' - Route
   * @param  {object} req - HttpRequest
   * @param  {object} res - HttpResponse
   */
  app.get('/callback', (req, res) => {
    const postBody = {
      url: QuickBooks.ACCESS_TOKEN_URL,
      oauth: {
        consumer_key,
        consumer_secret,
        token: req.query.oauth_token,
        token_secret: req.session.oauth_token_secret,
        verifier: req.query.oauth_verifier,
        realmId: req.query.realmId
      }
    };
    // This call is made to obtain the Access Token
    request.post(postBody, (error, response, body) => {
      const verifiedAccessToken = qs.parse(body);
      const token = verifiedAccessToken.oauth_token;
      const secret = verifiedAccessToken.oauth_token_secret;
      const companyId = postBody.oauth.realmId;
      const QB = new QuickBooks(consumer_key,
        consumer_secret,
        token,
        secret,
        companyId,
        true, // Sandbox
        true); // Debug
      QB.findCustomers({
          limit: 5
        },
        (err, results) => {
          const customerList = results.QueryResponse.Customer;
          app.models.Customer.destroyAll({});
          customerList.forEach(
            value => {
              app.models.Customer.create(value);
            });
          res.redirect('/');
        });
    });
  });
};
