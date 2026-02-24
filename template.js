const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getEventData = require('getEventData');
const getCookieValues = require('getCookieValues');
const getContainerVersion = require('getContainerVersion');
const getRemoteAddress = require('getRemoteAddress');
const getRequestHeader = require('getRequestHeader');
const getType = require('getType');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const parseUrl = require('parseUrl');
const sendHttpRequest = require('sendHttpRequest');
const setCookie = require('setCookie');

/*==============================================================================
==============================================================================*/

const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');
const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

if (data.type === 'page_view') {
  const url = getEventData('page_location') || getRequestHeader('referer');

  if (url) {
    const searchParams = parseUrl(url).searchParams;
    const cookieId = searchParams[data.clickIdParameterName || 'adfcookieid']; // Also know as "Adform third-party cookie ID"
    const clickId = searchParams[data.adformClickIdParameterName || 'adfcd'];

    if (cookieId || clickId) {
      const options = {
        domain: 'auto',
        path: '/',
        secure: true,
        httpOnly: false
      };
      if (data.expiration > 0) options['max-age'] = data.expiration;
      if (cookieId) setCookie('adfuid', cookieId, options, false);
      if (clickId) setCookie('_adfcd', clickId, options, false);
    }
  }
  return data.gtmOnSuccess();
} else {
  const adf_uid = data.clickId || getCookieValues('adfuid')[0] || ''; // Also know as "Adform third-party cookie ID"
  const adf_cd = data.adformClickId || getCookieValues('_adfcd')[0] || '';
  const userData = makeTableMap(data.userDataList || [], 'key', 'value') || {};

  const requestUrl =
    'https://' +
    enc(data.trackingDomain) +
    '/v2/sitetracking/' +
    enc(data.trackingsetupid) +
    '/trackingpoints/';
  const requestBody = {
    name: data.name,
    pageUrl: data.pageLocation || getEventData('page_location'),
    refererUrl: data.pageReferrer || getEventData('page_referrer'),
    identity: {
      cookieId: adf_uid,
      clickId: adf_cd
    },
    userContext: {
      userAgent: userData.user_agent || getRequestHeader('User-Agent'),
      userIp: userData.client_ip || getRemoteAddress(),
      browserLanguage: userData.browser_language || getEventData('language')
    }
  };
  const mobileDeviceId = data.mobileAdvertisingId || eventData['x-ga-resettable_device_id'];
  if (mobileDeviceId && mobileDeviceId !== '00000000-0000-0000-0000-000000000000') {
    requestBody.identity.advertisingId = mobileDeviceId;
  }
  const compliance = makeTableMap(data.compliance || [], 'key', 'value');
  if (compliance) requestBody.compliance = compliance;
  const variables = makeTableMap(data.variables || [], 'key', 'value');
  if (variables) requestBody.variables = variables;

  log({
    Name: 'Adform',
    Type: 'Request',
    TraceId: traceId,
    EventName: data.name,
    RequestMethod: 'POST',
    RequestUrl: requestUrl,
    RequestBody: requestBody
  });

  sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      log({
        Name: 'Adform',
        Type: 'Response',
        TraceId: traceId,
        EventName: data.name,
        ResponseStatusCode: statusCode,
        ResponseHeaders: headers,
        ResponseBody: body
      });

      if (statusCode >= 200 && statusCode < 300) {
        return data.gtmOnSuccess();
      } else {
        return data.gtmOnFailure();
      }
    },
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify([requestBody])
  );
}

/*==============================================================================
Helpers
==============================================================================*/

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}

function enc(data) {
  if (['null', 'undefined'].indexOf(getType(data)) !== -1) data = '';
  return encodeUriComponent(makeString(data));
}

function log(logObject) {
  if (isLoggingEnabled) {
    logToConsole(JSON.stringify(logObject));
  }
}

function determinateIsLoggingEnabled() {
  const containerVersion = getContainerVersion();
  const isDebug = !!(
    containerVersion &&
    (containerVersion.debugMode || containerVersion.previewMode)
  );

  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
