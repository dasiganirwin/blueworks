const { WebSocketServer } = require('ws');
const { verifyAccess } = require('../utils/jwt');

/** @type {WebSocketServer} */
let wss;

// job_id → Set of ws clients subscribed
const jobSubscriptions = new Map();

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via query param token: wss://host/ws?token=...
    const url    = new URL(req.url, 'http://localhost');
    const token  = url.searchParams.get('token');

    try {
      ws.user = verifyAccess(token);
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.event === 'job.subscribe' && msg.payload?.job_id) {
          subscribeToJob(ws, msg.payload.job_id);
        }
        if (msg.event === 'worker.location_ping' && ws.user.role === 'worker') {
          broadcast('worker.location_updated', {
            job_id: msg.payload?.job_id,
            lat:    msg.payload?.lat,
            lng:    msg.payload?.lng,
          }, msg.payload?.job_id);
        }
      } catch { /* ignore malformed frames */ }
    });

    ws.on('close', () => {
      jobSubscriptions.forEach((clients) => clients.delete(ws));
    });
  });

  // Heartbeat every 30s to clean dead connections
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  console.log('[ws] WebSocket server ready');
}

function subscribeToJob(ws, jobId) {
  if (!jobSubscriptions.has(jobId)) jobSubscriptions.set(jobId, new Set());
  jobSubscriptions.get(jobId).add(ws);
}

/**
 * Broadcast an event to all connected clients.
 * If jobId is provided, only notify clients subscribed to that job.
 * @param {string} event
 * @param {object} payload
 * @param {string} [jobId]
 */
function broadcast(event, payload, jobId) {
  const frame = JSON.stringify({ event, payload });

  if (jobId && jobSubscriptions.has(jobId)) {
    jobSubscriptions.get(jobId).forEach((ws) => {
      if (ws.readyState === ws.OPEN) ws.send(frame);
    });
    return;
  }

  // Broadcast to all authenticated clients
  if (wss) {
    wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) ws.send(frame);
    });
  }
}

module.exports = { initWebSocket, broadcast };
