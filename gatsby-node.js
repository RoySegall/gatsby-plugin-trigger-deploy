const { spawn } = require("child_process");
const axios = require("axios");

exports.onCreateDevServer = ({ app, reporter }, pluginOptions) => {

  const { secretKey, addressCallback } = pluginOptions;

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

  app.post('/deploy', function(req, res) {

    if (req.headers['secret_key'] !== secretKey) {
      const message = 'The secret which passed in the header is missing or does not matching the desired secret key';

      reporter.error(message);
      res.status(401).send({message});
    }

    res.status(201).send({message: 'Deployment process has started'});

    // Deploying.
    const deploy = spawn('npm', ['run', 'deploy']);

    deploy.stderr.on('data', (data) => {
      reporter.error(`An error during the deployment: ${data}`);

      notifyEventListener({
        event: 'deployment',
        status: 'failed',
        data: error,
      });
    });

    deploy.on('close', (code) => {
      reporter.success(`The deployment process has went OK`);

      if (addressCallback) {
        notifyEventListener({
          event: 'deployment',
          status: 'succeeded',
        });
      }
    });

  })
}
