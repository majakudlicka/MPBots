
var express = require('express');
var webhook = require('../../webhook');
var router = express.Router();

  router.get('/', (req, res) => {
  res.send('I should be working');
});

router.get('/webhook', (req, res) => {
  console.log(req.query);
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.FB_SECRET) {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});




module.exports = router;
