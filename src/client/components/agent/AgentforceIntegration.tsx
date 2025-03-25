import { useEffect } from "react";

declare const embeddedservice_bootstrap: any;

const AgentforceIntegration = () => {
  useEffect(() => {
    // Function to initialize Embedded Messaging
    const initEmbeddedMessaging = () => {
      try {
        embeddedservice_bootstrap.settings.language = "en_US";

        window.addEventListener("onEmbeddedMessagingReady", () => {
          console.log("✅ Embedded Messaging Ready");

          let userId = "005Hs00000GmZ77IAF";
          console.log("UserID:", userId);

          embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({
            UserID: userId,
          });
        });

        embeddedservice_bootstrap.init(
          "00DHs00000NDnj4",
          "TableauESA_CumulusGlitchPortal",
          "https://storm-5804dd9d2b3c1f.my.site.com/ESWTableauESACumulusGlit1741776438684",
          { scrt2URL: "https://storm-5804dd9d2b3c1f.my.salesforce-scrt.com" }
        );
      } catch (err) {
        console.error("❌ Error loading Embedded Messaging:", err);
      }
    };

    // Dynamically load the external script
    const script = document.createElement("script");
    script.src =
      "https://storm-5804dd9d2b3c1f.my.site.com/ESWTableauESACumulusGlit1741776438684/assets/js/bootstrap.min.js";
    script.type = "text/javascript";
    script.onload = initEmbeddedMessaging;
    console.log("script loaded")
    document.body.appendChild(script);

    // Cleanup script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // This component does not render anything
};

export default AgentforceIntegration;