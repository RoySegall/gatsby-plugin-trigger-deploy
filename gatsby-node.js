const { spawn } = require("child_process");
const axios = require("axios");
const bodyParser = require('body-parser');
const events = require('events');
const eventEmitter = new events.EventEmitter();

exports.onCreateDevServer = ({ app, reporter }, pluginOptions) => {

  const { secretKey, addressCallback, requestBodyHandler, preDeploy, callbackPayload } = pluginOptions;

  if (!secretKey) {
    reporter.error('You must have a secret key. Please look at the plugin documentation.');
    return;
  }

  const notifyEventListener = (data) => {

    if (!addressCallback) {
      return;
    }

    axios.post(addressCallback, data).then((response) => {
      reporter.success('The event has been arrived to the listener');
    }, (error) => {
      reporter.error(error);
    });
  };

  reporter.success('The trigger deploy plugin is ready.');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/deploy', function(req, res) {

    const payloadSecretKey = req.headers['secret_key'] || req.body['secret_key'];

    if (payloadSecretKey !== secretKey) {
      const message = 'The secret which passed in the header is missing or does not matching the desired secret key';

      reporter.error(message);
      res.status(401).send({message});
    }

    res.status(200).send({message: 'Deployment process has started'});

    // Handle request body
    if (typeof requestBodyHandler !== 'undefined') {
      requestBodyHandler(req.body);
    }

    // Handle pre deploy
    if (typeof preDeploy !== 'undefined') {
      preDeploy({ spawn, eventEmitter });
    }

    eventEmitter.on('predeploy-finished', () => {
      // Deploying.
      const deploy = spawn('npm', ['run', 'deploy']);

      deploy.stderr.on('data', (data) => {
        reporter.error(`An error during the deployment: ${data}`);

        notifyEventListener({
          event: 'deployment',
          status: 'failed',
          secret_key: payloadSecretKey,
          data: data,
        });
      });

      deploy.on('close', (code) => {
        reporter.success(`The deployment process has went OK`);

        let notifyPayload = {
          event: 'deployment',
          status: 'succeeded',
          secret_key: payloadSecretKey,
        }

        if (typeof callbackPayload !== 'undefined') {
          notifyPayload = {...notifyPayload, ...callbackPayload};
        }

        notifyEventListener(notifyPayload);
      });
    })
  })
}
