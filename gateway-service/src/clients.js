const FLIGHT_SERVICE_URL = process.env.FLIGHT_SERVICE_URL || "http://flight-service:8060";
const TICKET_SERVICE_URL = process.env.TICKET_SERVICE_URL || "http://ticket-service:8070";
const BONUS_SERVICE_URL = process.env.BONUS_SERVICE_URL || "http://bonus-service:8050";

class BonusUnavailableError extends Error {}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  if (res.status === 404) return { status: 404, body: null };
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function requestBonusJson(url, options) {
  let result;
  try {
    result = await requestJson(url, options);
  } catch (err) {
    throw new BonusUnavailableError();
  }
  if (result.status >= 500) throw new BonusUnavailableError();
  return result;
}

function authHeaders(authHeader, headers = {}) {
  return authHeader ? { ...headers, Authorization: authHeader } : headers;
}

function jsonPost(authHeader, body) {
  return {
    method: "POST",
    headers: authHeaders(authHeader, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  };
}

async function listFlights(authHeader, page, size) {
  const params = new URLSearchParams();
  if (page !== undefined) params.set("page", page);
  if (size !== undefined) params.set("size", size);
  const { body } = await requestJson(`${FLIGHT_SERVICE_URL}/api/v1/flights?${params}`, {
    headers: authHeaders(authHeader),
  });
  return body;
}

async function getFlight(authHeader, flightNumber) {
  const { status, body } = await requestJson(
    `${FLIGHT_SERVICE_URL}/api/v1/flights/${encodeURIComponent(flightNumber)}`,
    { headers: authHeaders(authHeader) }
  );
  return status === 404 ? null : body;
}

async function listTickets(authHeader, username) {
  const { body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets?username=${encodeURIComponent(username)}`,
    { headers: authHeaders(authHeader) }
  );
  return body || [];
}

async function getTicket(authHeader, username, ticketUid) {
  const { status, body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets/${encodeURIComponent(ticketUid)}?username=${encodeURIComponent(username)}`,
    { headers: authHeaders(authHeader) }
  );
  return status === 404 ? null : body;
}

async function createTicket(authHeader, payload) {
  const { body } = await requestJson(`${TICKET_SERVICE_URL}/api/v1/tickets`, jsonPost(authHeader, payload));
  return body;
}

async function cancelTicket(authHeader, username, ticketUid) {
  const { status, body } = await requestJson(
    `${TICKET_SERVICE_URL}/api/v1/tickets/${encodeURIComponent(ticketUid)}?username=${encodeURIComponent(username)}`,
    { method: "DELETE", headers: authHeaders(authHeader) }
  );
  return status === 404 ? null : body;
}

async function getPrivilege(authHeader, username) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege?username=${encodeURIComponent(username)}`,
    { headers: authHeaders(authHeader) }
  );
  return body;
}

async function fillPrivilege(authHeader, username, ticketUid, amount) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/fill`,
    jsonPost(authHeader, { username, ticketUid, amount })
  );
  return body;
}

async function debitPrivilege(authHeader, username, ticketUid, amount) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/debit`,
    jsonPost(authHeader, { username, ticketUid, amount })
  );
  return body;
}

async function cancelPrivilege(authHeader, username, ticketUid) {
  const { body } = await requestBonusJson(
    `${BONUS_SERVICE_URL}/api/v1/privilege/tickets/${encodeURIComponent(ticketUid)}/cancel`,
    jsonPost(authHeader, { username })
  );
  return body;
}

module.exports = {
  listFlights,
  getFlight,
  listTickets,
  getTicket,
  createTicket,
  cancelTicket,
  getPrivilege,
  fillPrivilege,
  debitPrivilege,
  cancelPrivilege,
  BonusUnavailableError,
};
