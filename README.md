# Gatsby plugin trigger deploy

## Usage

The plugin provides endpoint for triggering the deployment process. The classing use case is a self hosted CMS, Drupal 
or Wordpress, and a gatsby site which pull data from the CMS. Now, how does the cotent authors in the site will deploy
the site to Github pages, or to S3?

If you still think on a solution - you are in the correct place. The plugin expose a REST endpoint for trigger the 
`npm run deploy` command. The endpoint requires a secret key inorder to prevent from anyone to deploy your site.

## Install

`npm install --save gatsby-plugin-trigger-deploy`

## How to use

```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-trigger-deploy`,
      options: {
        secretKey: 'a super secret key, maybe with emojis? 🍕',
        addressCallback: 'http://localhost/endpoint/for/notifying',
        requestBodyHandler: (reqBody) => {
            // Do something with request body
        },
        preDeploy: ({ spawn, eventEmitter}) => {
            // Do things before deploying, then emit an event
            // to start deployment process
            const prepare = spawn('npm', ['run', 'mytask'])
            prepare.on('exit', (exitcode) => {
                    eventEmitter.emit('predeploy-finished');
            });
        }
      },
    },
  ],
}
```

In order to trigger the deployment you'll need to send a request similar to this:

```javascript
var axios = require('axios');

var config = {
  method: 'post',
  url: 'http://localhost:8000/deploy',
  headers: { 
    'secret_key': 'a super secret key, maybe with emojis? 🍕', 
  }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
```

## Options

* secretKey - Required; The secret key which is required for triggering the deployment process. 
* addressCallback - Optional; If defined, the plugin will send REST request with data on the deployment process. 
* requestBodyHandler - Optional; function to handle/process additional data passed in request body
* preDeploy - Optional; function that run before the actual deployment process started 
