/* =========================
   FORM TEMPLATE CONFIGURATION
   Shared by workspace controls and output builders.
========================= */

const formTemplateFields = Object.freeze({
  annotations: [
    {
      label: "Order-ID",

      outputLabel: "Order-ID :",

      placeholderName: "Order-ID",

      key: "annotationOrderId",
    },

    {
      label: "Concern",

      outputLabel: "Concern :",

      key: "annotationConcern",

      multiline: true,
    },

    {
      label: "Action taken",

      outputLabel: "Action taken :",

      key: "annotationActionTaken",

      multiline: true,
    },
  ],

  dartTemplate: [
    {
      label: "Contact ID",

      outputLabel: "Contact ID:",

      key: "dartContactId",
    },

    {
      label: "Order ID",

      outputLabel: "Order ID :",

      key: "dartOrderId",
    },

    {
      label: "Customer Issue",

      outputLabel: "Customer Issue :",

      key: "dartCustomerIssue",

      multiline: true,
    },

    {
      label: "Assistance required from DART",

      outputLabel: "Assistance required from DART :",

      key: "dartAssistanceRequired",

      multiline: true,
    },
  ],
});

export { formTemplateFields };
