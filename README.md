# Adform tag for Google Tag Manager Server Side

There are two configuration types that Adform tag includes: PageView and TrackEvent.

- Pageview event stores the `adfcookieid` and `adfcd` URL parameters inside the `adfuid` and `_adfcd` cookies, respectively.
- TrackEvent event sends a request with the specified conversion event data to Adform API.

## How to use the Adform tag:

**Pageview** - Fire this event when the user reaches your landing page in order to capture and store Adform URL identifiers. These identifiers will then later be used on further events for attribution and user context purposes.

- Input your [Adform Cookie ID](https://www.adformhelp.com/hc/en-us/articles/9740579489041-Use-Server-Side-Tracking#UUID-8913ffd2-24c4-09ed-4ee9-55c2bec39e73_bridgehead-idm4599406268131232501691310204) parameter that was used in Adform campaign settings (macro `__ADFUID__` ).
- Input your [Adform click ID](https://stape.io/blog/adform-tag-for-server-side-google-tag-manager) parameter that was used in Adform campaign settings (macro `__ADFCD__` )
- Update `adfuid` and `_adfcd` cookie lifetime is needed.

**Track events** - Make a POST request to Adform Server Side Tracking API.

- **Tracking Domain** - is the tracking domain set on the advertiser level.
- **Tracking Setup ID** - is the advertiser's tracking ID, which can be found under Site Tracking in Adform UI.
- **Event Name** - event-based conversion name that was setup in Adform, case-sensitive.
- **Variables** - a table map of event variables that are sent to Adform API.
- **Compliance** - pass information about the user's consent to the Adform API.

### Useful links:

- https://stape.io/blog/adform-tag-for-server-side-google-tag-manager

## Open Source

Adform Tag for GTM Server Side is developed and maintained by [Stape Team](https://stape.io/) under the Apache 2.0 license.

### GTM Gallery Status
🟢 [Listed](https://tagmanager.google.com/gallery/#/owners/stape-io/templates/adform-tag)
