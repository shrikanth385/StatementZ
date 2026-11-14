const marketplaceDomains = Object.freeze({
  US: "amazon.com",
  CA: "amazon.ca",
  UK: "amazon.co.uk",
  DE: "amazon.de",
  FR: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
  NL: "amazon.nl",
  SE: "amazon.se",
  PL: "amazon.pl",
  BE: "amazon.com.be",
  IN: "amazon.in",
  AE: "amazon.ae",
  SA: "amazon.sa",
  TR: "amazon.com.tr",
  SG: "amazon.sg",
  AU: "amazon.com.au",
  JP: "amazon.co.jp",
  MX: "amazon.com.mx",
  BR: "amazon.com.br",
});

const ordersPagePath = "/gp/css/order-history";

const marketplaceLinks = Object.freeze(
  Object.fromEntries(
    Object.entries(marketplaceDomains).map(([marketplace, domain]) => [
      marketplace,
      `https://www.${domain}${ordersPagePath}`,
    ]),
  ),
);

const marketplaceOptions = Object.freeze(
  Object.keys(marketplaceDomains).map((marketplace) => ({
    label: marketplace,
    value: marketplace,
  })),
);

export { marketplaceLinks, marketplaceOptions };
