const sendHttpRequest = require('sendHttpRequest');
const setCookie = require('setCookie');
const parseUrl = require('parseUrl');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const getCookieValues = require('getCookieValues');
const getEventData = require('getEventData');
const getRemoteAddress = require('getRemoteAddress');
const makeTableMap = require('makeTableMap');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const encodeUriComponent = require('encodeUriComponent');

const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

if (data.type === 'page_view') {
  const url = getEventData('page_location') || getRequestHeader('referer');

  if (url) {
    const value = parseUrl(url).searchParams[data.clickIdParameterName];

    if (value) {
      const options = {
        domain: 'auto',
        path: '/',
        secure: true,
        httpOnly: false
      };

      if (data.expiration > 0) options['max-age'] = data.expiration;

      setCookie('adfuid', value, options, false);
    }
  }

  data.gtmOnSuccess();
} else {
  const adf_uid = data.clickId || getCookieValues('adfuid')[0] || '';
  const userData = makeTableMap(data.userDataList || [], 'key', 'value');

  let requestUrl =
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
      cookieId: adf_uid
    },
    userContext: {
      userAgent: userData.user_agent || getRequestHeader('User-Agent'),
      userIp: userData.client_ip || getRemoteAddress(),
      browserLanguage: userData.browser_language || getEventData('language')
    }
  };
  const compliance = makeTableMap(data.compliance || [], 'key', 'value');
  if (compliance) requestBody.compliance = compliance;
  const variables = makeTableMap(data.variables || [], 'key', 'value');
  if (variables) requestBody.variables = variables;

  if (isLoggingEnabled) {
    logToConsole(
      JSON.stringify({
        Name: 'Adform',
        Type: 'Request',
        TraceId: traceId,
        EventName: data.name,
        RequestMethod: 'POST',
        RequestUrl: requestUrl,
        RequestBody: requestBody
      })
    );
  }

  sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      if (isLoggingEnabled) {
        logToConsole(
          JSON.stringify({
            Name: 'Adform',
            Type: 'Response',
            TraceId: traceId,
            EventName: data.name,
            ResponseStatusCode: statusCode,
            ResponseHeaders: headers,
            ResponseBody: body
          })
        );
      }

      if (statusCode >= 200 && statusCode < 300) {
        data.gtmOnSuccess();
      } else {
        data.gtmOnFailure();
      }
    },
    { method: 'POST' },
    JSON.stringify([requestBody])
  );
}

function enc(data) {
  data = data || '';
  return encodeUriComponent(data);
}

function determinateIsLoggingEnabled() {
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
