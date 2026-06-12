
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com","https://extensions.shopifycdn.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills-legacy.BcltRhPu.js","/cdn/shopifycloud/checkout-web/assets/c1/app-legacy.P2lepe9z.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor-legacy.BzLpyt_e.js","/cdn/shopifycloud/checkout-web/assets/c1/browser-legacy.Dq5gWY96.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-is-shop-pay-active-legacy.DVXspEIB.js","/cdn/shopifycloud/checkout-web/assets/c1/types-UnauthenticatedErrorModalPayload-legacy.Dvi0bYeb.js","/cdn/shopifycloud/checkout-web/assets/c1/images-payment-icon-legacy.BW3R3WiF.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shop-discount-offer-legacy.5xJO_Dwk.js","/cdn/shopifycloud/checkout-web/assets/c1/NotFound-legacy.COcf6wym.js","/cdn/shopifycloud/checkout-web/assets/c1/context-utilities-legacy.BC_6whaJ.js","/cdn/shopifycloud/checkout-web/assets/c1/shared-unactionable-errors-legacy.C5pfyQAR.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-installmentsNotSupportedForAddress-legacy.CoxlvPAo.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayCheckoutGqlVersion-legacy.uf4uIGR_.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-ShopPayCheckoutSessionQuery-legacy.Cf47112W.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors-legacy.D9-Rvnl_.js","/cdn/shopifycloud/checkout-web/assets/c1/types-index-legacy.BduMr8Zr.js","/cdn/shopifycloud/checkout-web/assets/c1/images-flag-icon-legacy.Bfupgm8k.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en-legacy.CbPLwvhd.js","/cdn/shopifycloud/checkout-web/assets/c1/page-OnePage-legacy.DkC9Eps3.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout-legacy.1u0LlZ8r.js","/cdn/shopifycloud/checkout-web/assets/c1/remember-me-hooks-legacy.CCYbOby3.js","/cdn/shopifycloud/checkout-web/assets/c1/OffsitePaymentFailed-legacy.DIJXJV6I.js","/cdn/shopifycloud/checkout-web/assets/c1/NoAddressLocationFullDetour-legacy.D7B-Cv4x.js","/cdn/shopifycloud/checkout-web/assets/c1/SplitDeliveryMerchandiseContainer-legacy.9bkU8ygx.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName-legacy.CEhLEM-I.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink-legacy.CBKkTALf.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletsSandbox-WalletSandbox-legacy.DTvInrCA.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUnauthenticatedErrorModal-legacy.BZubGagn.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl-legacy.CpF3uYgl.js","/cdn/shopifycloud/checkout-web/assets/c1/GooglePayButton-index-legacy.Dy4KhWAK.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer-legacy.CSoIg5jG.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummaryLine-legacy.BjCAXbTb.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview-legacy.BcqmlQIo.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks-legacy.B8c5QrJ4.js","/cdn/shopifycloud/checkout-web/assets/c1/LocalizationExtensionField-legacy.C04FDDzo.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayPaymentRequiredMethod-legacy.jBGf1WLK.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress-legacy.DIMt4oIv.js","/cdn/shopifycloud/checkout-web/assets/c1/WalletLogo-legacy.B7gftlKi.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage-legacy.Bwhk8rRp.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowShopPayOptin-legacy.ObW7I7Je.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShowCreateMoreAccountsGdprTreatment-legacy.CpovPQ20.js","/cdn/shopifycloud/checkout-web/assets/c1/Section-legacy.BAm7h7B6.js","/cdn/shopifycloud/checkout-web/assets/c1/MobileOrderSummary-legacy.0WX569go.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useOnePageFormSubmit-legacy.B-n0IGIr.js","/cdn/shopifycloud/checkout-web/assets/c1/PayPalOverCaptureInfoBanner-legacy.BNsVlpMm.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-get-negotiation-input-legacy.CXJRsVey.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-cash-constants-legacy.M3iBP-tP.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner-legacy.CgPNzuAv.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList-legacy.CY8-NTZA.js","/cdn/shopifycloud/checkout-web/assets/c1/DutyOptions-legacy.DRky5_bt.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown-legacy.CgdhRgYW.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal-legacy.CP68gemb.js","/cdn/shopifycloud/checkout-web/assets/c1/extension-targets-shipping-options-legacy.T9puN7ZO.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector-legacy.gNf1KclT.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown-legacy.CT0NPhOV.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSubscribeMessenger-legacy.iaevreqk.js","/cdn/shopifycloud/checkout-web/assets/c1/component-RuntimeExtension-legacy.BuGfEZTV.js","/cdn/shopifycloud/checkout-web/assets/c1/AnnouncementRuntimeExtensions-legacy.Bv9I2M4v.js","/cdn/shopifycloud/checkout-web/assets/c1/extension-targets-rendering-extension-targets-legacy.1cGumeFA.js","/cdn/shopifycloud/checkout-web/assets/c1/esm-browser-v4-legacy.On_frbc2.js","/cdn/shopifycloud/checkout-web/assets/c1/ExtensionsInner-legacy.DHGDNBsp.js"];
      var styles = [];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  