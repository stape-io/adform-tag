const computeEffectiveTldPlusOne = require('computeEffectiveTldPlusOne');
const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getEventData = require('getEventData');
const getCookieValues = require('getCookieValues');
const getRequestHeader = require('getRequestHeader');
const getType = require('getType');
const JSON = require('JSON');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const parseUrl = require('parseUrl');
const sendHttpRequest = require('sendHttpRequest');
const setCookie = require('setCookie');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (shouldExitEarly(data, eventData)) return;

if (data.type === 'page_view') {
  const url = getUrl(eventData);

  if (url) {
    const searchParams = parseUrl(url).searchParams;
    const cookieId = searchParams[data.clickIdParameterName || 'adfcookieid']; // Also know as "Adform third-party cookie ID"
    const clickId = searchParams[data.adformClickIdParameterName || 'adfcd'];

    if (cookieId || clickId) {
      const options = {
        domain: getCookieDomain(data.cookieDomain),
        path: '/',
        samesite: data.cookieSameSite || 'none',
        secure: true,
        httpOnly: false
      };
      if (data.expiration > 0) options['max-age'] = data.expiration;
      if (isCookieIdValid(cookieId)) setCookie('adfuid', cookieId, options, false);
      if (isClickIdValid(clickId)) setCookie('_adfcd', clickId, options, false);
    }
  }
  return data.gtmOnSuccess();
} else {
  const cookieId = data.clickId || getCookieValues('adfuid')[0] || ''; // Also know as "Adform third-party cookie ID"
  const clickId = data.adformClickId || getCookieValues('_adfcd')[0] || '';
  const userData = makeTableMap(data.userDataList || [], 'key', 'value') || {};

  const requestUrl =
    'https://' +
    enc(data.trackingDomain) +
    '/v2/sitetracking/' +
    enc(data.trackingsetupid) +
    '/trackingpoints/';
  const requestBody = {
    name: data.name,
    pageUrl: data.pageLocation || eventData.page_location,
    refererUrl: data.pageReferrer || eventData.page_referrer,
    identity: {
      cookieId: isCookieIdValid(cookieId) ? cookieId : '',
      clickId: isClickIdValid(clickId) ? clickId : ''
    },
    userContext: {
      userAgent: userData.user_agent || eventData.user_agent,
      userIp: userData.client_ip || eventData.ip_override,
      browserLanguage: userData.browser_language || eventData.language
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

  sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      return statusCode >= 200 && statusCode < 300 ? data.gtmOnSuccess() : data.gtmOnFailure();
    },
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify([requestBody])
  );
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function isCookieIdValid(cookieId) {
  return makeString(cookieId).match('^[-\\d]\\d{17,19}$') !== null;
}

function isClickIdValid(clickId) {
  return makeString(clickId).match('^[0-9]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+$') !== null;
}

/*==============================================================================
Helpers
==============================================================================*/

function getUrl(eventData) {
  return eventData.page_location || getRequestHeader('referer') || eventData.page_referrer;
}

function shouldExitEarly(data, eventData) {
  if (!isConsentGivenOrNotRequired(data, eventData)) {
    data.gtmOnSuccess();
    return true;
  }

  const url = getUrl(eventData);
  if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) {
    data.gtmOnSuccess();
    return true;
  }

  return false;
}

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

function getCookieDomain(defaultCookieDomain) {
  return !defaultCookieDomain || defaultCookieDomain === 'auto'
    ? computeEffectiveTldPlusOne(getEventData('page_location') || getRequestHeader('referer')) ||
        'auto'
    : defaultCookieDomain;
}
