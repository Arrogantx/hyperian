import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const RPC_URL = 'https://rpc.hyperliquid.xyz/evm';

const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error', details: err.message }),
    };
  }
};

export { handler };
