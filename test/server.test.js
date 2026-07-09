const test = require('node:test');
const assert = require('node:assert/strict');
const { getAzureConfig } = require('../src/server');

test('configuration errors expose the missing Azure variables', () => {
  const originalEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const originalApiKey = process.env.AZURE_OPENAI_API_KEY;
  const originalDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;

  assert.throws(
    () => getAzureConfig(),
    (error) => {
      assert.equal(error.expose, true);
      assert.match(error.message, /AZURE_OPENAI_ENDPOINT/);
      assert.match(error.message, /AZURE_OPENAI_API_KEY/);
      assert.match(error.message, /AZURE_OPENAI_DEPLOYMENT/);
      return true;
    }
  );

  if (originalEndpoint === undefined) delete process.env.AZURE_OPENAI_ENDPOINT;
  else process.env.AZURE_OPENAI_ENDPOINT = originalEndpoint;
  if (originalApiKey === undefined) delete process.env.AZURE_OPENAI_API_KEY;
  else process.env.AZURE_OPENAI_API_KEY = originalApiKey;
  if (originalDeployment === undefined) delete process.env.AZURE_OPENAI_DEPLOYMENT;
  else process.env.AZURE_OPENAI_DEPLOYMENT = originalDeployment;
});
