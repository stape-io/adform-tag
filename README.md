# Adform tag for Google Tag Manager Server Side

There are two configuration types that Adform tag includes: PageView and TrackEvent.

- Pageview event stores the adfcookieid URL parameter inside the adfuid cookie.
- TrackEvent event sends a request with the specified conversion event data to Adform API.

## How to use the Adform tag:

**Pageview** - add [Adform click ID](https://www.adformhelp.com/hc/en-us/articles/9740579489041-Use-Server-Side-Tracking#UUID-8913ffd2-24c4-09ed-4ee9-55c2bec39e73_bridgehead-idm4599406268131232501691310204) parameter that was used in Adform campaign settings. Update adfuid cookie lifetime is needed.

**Track events** - make a POST request to Adform Server Side Tracking API.

- **Tracking Domain** - is the tracking domain set on the advertiser level.
- **Tracking Setup ID** - is the advertiser's tracking ID, which can be found under Site Tracking in Adform UI.
- **Event Name** - event-based conversion name that was setup in Adform, case-sensitive.
- **Variables** - a table map of event variables that are sent to Adform API.
- **Compliance** - pass information about the user's consent to the Adform API.

## Open Source

Adform Tag for GTM Server Side is developed and maintained by [Stape Team](https://stape.io/) under the Apache 2.0 license.
