'use strict';

const {
  name,
  version
} = require('../../package');

const status = () => {
  var started = new Date();
  return function (req, res) {
    res.send({
      started: started,
      uptime: (Date.now() - Number(started)) / 1000,
      name,
      version
    });
  };
};

module.exports = function (server) {
  const router = server.loopback.Router();
  router.get('/healthcheck', status());
  server.use(router);
};
