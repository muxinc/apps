'use strict';

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const handleForms = require('./forms-handler');
const handleWorkspaces = require('./workspaces-handler');
const fetchAccessToken = require('./fetch-access-token');

const deps = {
  fetch
};

const app = express();

const FRONTEND = path.dirname(require.resolve('typeform-frontend'));

app.use('/forms', async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).send('Unauthorized');
  }
  const [, token] = authorization.split(' ');
  const { status, body } = await handleForms(req.method, req.path, token, deps);
  res.status(status).send(body);
});

app.use('/workspaces', async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(401).send('Unauthorized');
  }
  const [, token] = authorization.split(' ');
  const { status, body } = await handleWorkspaces(req.method, req.path, token, deps);
  res.status(status).send(body);
});

app.use('/callback', async (req, res) => {
  const { code } = req.query;
  const { host } = req.headers;

  if (!code) {
    res.status(404).send('No Code was provided');
  }

  const origin = `${req.protocol}://${host}`;

  const { access_token, expires_in } = await fetchAccessToken(code, origin, deps);

  res.set({
    Location: `${origin}/frontend/?token=${access_token}&expiresIn=${expires_in}`
  });
  res.sendStatus(302);
});

app.use('/frontend', express.static(FRONTEND));

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
