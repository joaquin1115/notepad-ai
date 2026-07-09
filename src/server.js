const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const port = process.env.PORT || 8080;
const publicDir = join(__dirname, '..', 'public');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
  }

  return body ? JSON.parse(body) : {};
}

function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';
  const missing = [
    !endpoint && 'AZURE_OPENAI_ENDPOINT',
    !apiKey && 'AZURE_OPENAI_API_KEY',
    !deployment && 'AZURE_OPENAI_DEPLOYMENT'
  ].filter(Boolean);

  if (missing.length > 0) {
    const error = new Error(`Missing required Azure OpenAI configuration: ${missing.join(', ')}`);
    error.statusCode = 500;
    error.expose = true;
    throw error;
  }

  return { endpoint: endpoint.replace(/\/$/, ''), apiKey, deployment, apiVersion };
}

async function createAnswer(prompt) {
  const { endpoint, apiKey, deployment, apiVersion } = getAzureConfig();
  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: process.env.SYSTEM_PROMPT || 'You are a concise assistant writing directly into a plain notepad. Answer without markdown unless it is useful.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: Number(process.env.AZURE_OPENAI_TEMPERATURE || 0.7),
      stream: false
    })
  });

  const responseText = await response.text();
  let payload = {};

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    payload = { error: { message: responseText } };
  }

  if (!response.ok) {
    const upstreamMessage = payload.error?.message || payload.message || response.statusText || 'Azure OpenAI rejected the request.';
    const error = new Error(`Azure OpenAI error (${response.status}): ${upstreamMessage}`);
    error.statusCode = response.status >= 500 ? 502 : response.status;
    error.expose = true;
    throw error;
  }

  return payload.choices?.[0]?.message?.content?.trim() || '';
}

async function handleApi(req, res) {
  const body = await readJson(req);
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt) {
    sendJson(res, 400, { error: 'Write a prompt before using the keyboard shortcut.' });
    return;
  }

  const text = await createAnswer(prompt);
  sendJson(res, 200, { text });
}

async function serveStatic(req, res) {
  const requestedPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const safePath = normalize(requestedPath).replace(/^\.\.(?:[/\\]|$)/, '');
  const filePath = join(publicDir, safePath);
  const data = await readFile(filePath);
  res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/respond') {
      await handleApi(req, res);
      return;
    }

    if (req.method === 'GET') {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 404 || error.code === 'ENOENT') {
      const indexHtml = await readFile(join(publicDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': contentTypes['.html'] });
      res.end(indexHtml);
      return;
    }

    console.error(error);
    sendJson(res, statusCode, {
      error: error.expose || statusCode < 500 ? error.message : 'The assistant could not answer right now.'
    });
  }
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`Notepad listening on port ${port}`);
  });
}

module.exports = { server, createAnswer, getAzureConfig };
