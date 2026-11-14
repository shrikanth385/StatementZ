import { marketplaceLinks } from "../shell/marketplaceLinks.js";
import {
  calculateDateAfterOffset,
  dateOffsetHandlers,
  formatDate,
  getDateAfterOffset,
  getSignedOffset,
} from "../core/dateUtils.js";
import { formTemplateFields } from "./formTemplateConfig.js";

const dnrItemMissingConcernMap = Object.freeze({
  dnr: "the package you haven't received",

  itemMissing: "the missing item",
});

const photoVerificationInformationMap = Object.freeze({
  photoDamaged: "received items",

  photoReturnReceipt: "return receipt",
});

const photoVerificationEmailDetails = Object.freeze({
  photoDamaged: {
    context:
      "Thank you for contacting Amazon about the issue with the item you received. As requested, please send images so our team can review the damage or defect.",
    instructions: "Please upload the images using the link below:",
    guidelines:
      "Please include one image showing the full item and close-up images that clearly show the damage or defect. Use good lighting, keep the images in focus, and make sure the affected area is not obscured.",
    attachmentFallback:
      "If you’re unable to upload the images through the link, simply reply to this email and attach them.",
    response:
      "After sending the images, please allow the concerned team 24–48 hours to review them and respond.",
  },
  photoReturnReceipt: {
    context:
      "Thank you for contacting Amazon about the item you say you returned. To help us verify and investigate the return, Amazon needs a copy of your return receipt.",
    instructions: "Please upload an image of the return receipt using the link below:",
    guidelines:
      "Please send a clear, well-lit image of the full receipt. Make sure all text is in focus and readable, especially the return date, carrier, and tracking or reference number if shown.",
    attachmentFallback:
      "If you’re unable to upload the receipt through the link, simply reply to this email and attach a clear photo or scan of it.",
    response:
      "After sending the receipt, please allow the concerned team 24–48 hours to review it and respond.",
  },
});

const escalationPersonMap = Object.freeze({
  escalationSupervisor: "supervisor",

  escalationManager: "manager",
});

const refundConfirmationMethodLabels = Object.freeze({
  originalPaymentMethod: "Original payment method",

  amazonGiftCard: "Amazon Gift card",
});

const returnRequiredStatementKeys = Object.freeze([
  "returnRequiredForRefund",
  "returnRequiredForReplacement",
  "returnAvoid",
  "returnRequiredForRepair",
]);

function createCurrencyFormatter(state) {
  return function formatCurrencyAmount(amount, placeholderName) {
    if (!amount) {
      return `[Enter ${placeholderName}]`;
    }

    if (/^[^\d\s]/.test(amount)) {
      return amount;
    }

    return `${state.activeCurrency}${amount}`;
  };
}

function createDynamicInputReader(state) {
  return function getDynamicInputValue(key, placeholderName = key) {
    return state.dynamicInputs[key] || `[Enter ${placeholderName}]`;
  };
}

function replacePlaceholders(statement, replacements) {
  return Object.entries(replacements).reduce(
    (output, [key, value]) =>
      output.replaceAll(`\${${key}}`, value).replaceAll(`{${key}}`, value),
    statement,
  );
}

function joinOutputParts(...parts) {
  return parts.flat().filter(Boolean).join(" ");
}

function labeledOutputLine(field, getDynamicInputValue) {
  return `${field.outputLabel || field.label} ${getDynamicInputValue(
    field.key,
    field.placeholderName || field.label,
  )}`;
}

function getMappedSelection(map, selectedValue, fallbackValue) {
  return map[selectedValue] ? selectedValue : fallbackValue;
}

function createCustomOutputBuilders({
  state,
  stateQueries,
  getCachedStatement,
  getDefaultStatement,
  getSelectedRadioValue,
  isCheckboxChecked,
}) {
  const formatCurrencyAmount = createCurrencyFormatter(state);
  const getDynamicInputValue = createDynamicInputReader(state);

  function getSelectedValue(groupName, fallbackValue = "") {
    return getSelectedRadioValue(groupName, fallbackValue);
  }

  function getSelectedToolStatement(toolName, fallbackValue) {
    return state.selectedStatementKeys[toolName] || fallbackValue;
  }

  function getMappedToolStatement(toolName, map, fallbackValue) {
    return getMappedSelection(
      map,
      state.selectedStatementKeys[toolName],
      fallbackValue,
    );
  }

  function getStatementWithReplacements(statementKey, replacements) {
    return replacePlaceholders(getCachedStatement(statementKey), replacements);
  }

  function buildSelectedOutput(
    groupName,
    fallbackValue,
    handlers = {},
    defaultBuilder = getCachedStatement,
  ) {
    const selectedValue = getSelectedValue(groupName, fallbackValue);

    return (handlers[selectedValue] || defaultBuilder)(selectedValue);
  }

  function getDateAfterDays(dateValue, offsetValue, placeholderName) {
    return getDateAfterOffset({
      dateValue,
      offsetValue,
      unit: "days",
      placeholderName,
    });
  }

  function getFormattedRefundAmount() {
    return formatCurrencyAmount(
      state.dynamicInputs.refundAmount,
      "refundAmount",
    );
  }

  function buildConcessionProbeOutput() {
    const { concessionType, statementKey } = getReturnLessConcessionAppendix();

    const statement = getStatementWithReplacements("concessionProbe", {
      concessionProbe: concessionType,
    });

    return joinOutputParts(
      statement,
      statementKey && getCachedStatement(statementKey),
    );
  }

  function getReturnLessConcessionAppendix() {
    const isRefundChecked = isCheckboxChecked("returnLessRefund");

    const isReplacementChecked = isCheckboxChecked("returnLessReplacement");

    if (isRefundChecked && isReplacementChecked) {
      return {
        concessionType: "refund or replacement",

        statementKey: "multipleOption",
      };
    }

    if (isReplacementChecked) {
      return {
        concessionType: "replacement",

        statementKey: "singleOption",
      };
    }

    if (isRefundChecked) {
      return {
        concessionType: "refund",

        statementKey: "refundProbe",
      };
    }

    return {
      concessionType: "[Enter concessionProbe]",

      statementKey: "",
    };
  }

  function buildRefundIssueOutput() {
    const refundDetails = stateQueries.refundDetails();

    return getStatementWithReplacements("refundIssue", {
      refundAmount: getFormattedRefundAmount(),

      refundMethod: refundDetails.label,

      refundTimeline: refundDetails.timeline,
    });
  }

  function buildRefundConfirmationEmailOutput() {
    const orderId = getDynamicInputValue("orderId", "Order ID");
    const refundMethod = getSelectedValue(
      "refundMethod",
      "originalPaymentMethod",
    );
    const marketplace = state.activeMarketplace || "US";
    const refundDetails = stateQueries.refundDetails();
    const refundMethodLabel =
      refundConfirmationMethodLabels[refundMethod] || refundDetails.label;
    const ordersPageLink = marketplaceLinks[marketplace] || marketplaceLinks.US;

    return `Hello,

This email confirms that a refund has been initiated for your order on ${formatDate(new Date())}.

Order ID: ${orderId}
Refund Amount: ${getFormattedRefundAmount()}
Refund Method: ${refundMethodLabel}

You can track the refund status by visiting:

${ordersPageLink}

Once there, select Order ID ${orderId} and review the refund details within the Order Details section.

Please allow up to ${refundDetails.timeline} for the refund to be reflected in your account.

If the refund has not been received after ${refundDetails.timeline}, please contact us back for further assistance.

Thank you for shopping with Amazon.`;
  }

  function buildMfnOrdersOutput() {
    const selectedType = getSelectedToolStatement("mfnOrders", "sellerContact");

    if (selectedType !== "wait48hours") {
      return getCachedStatement(selectedType);
    }

    return getStatementWithReplacements("wait48hours", {
      date: getDynamicInputValue("date", "date"),

      deadlineDate: getDateAfterOffset({
        dateValue: state.dynamicInputs.date,

        offsetValue: 48,

        unit: "hours",

        placeholderName: "deadlineDate",
      }),
    });
  }

  function buildFormTemplateOutput(fields) {
    return fields
      .map((row) => labeledOutputLine(row, getDynamicInputValue))
      .join("\n\n");
  }

  function createFormTemplateOutputBuilder(templateKey) {
    return () => buildFormTemplateOutput(formTemplateFields[templateKey]);
  }

  function buildDateCalculatorOutput() {
    const unit = isCheckboxChecked("businessDays") ? "businessDays" : "days";
    const waitDate = calculateDateAfterOffset({
      dateValue: state.dynamicInputs.dateCalculatorInputDate,
      offsetValue: getSignedOffset(
        state.dynamicInputs.dateCalculatorDays,
        getSelectedValue("dateCalculatorOperation", "add"),
      ),
      unit,
    });

    if (!waitDate) {
      const placeholder = "[Enter calculated date]";
      return `${placeholder}\n${placeholder}`;
    }

    const contactDate = dateOffsetHandlers[unit](waitDate, 1);

    return `${formatDate(waitDate)}\n${formatDate(contactDate)}`;
  }

  function buildNotepadOutput() {
    return state.dynamicInputs.notepadContent || "";
  }

  function buildTokenApologyOutput(promoProbingStatement) {
    return getStatementWithReplacements("tokenApology", {
      promoProbing: promoProbingStatement,
    });
  }

  function buildPromoIssueOutput() {
    const tokenType = getSelectedValue("apologyTokenType", "promoIssue");

    if (
      tokenType === "partialRefund" &&
      isCheckboxChecked("concessionTypeProbing")
    ) {
      const concessionProbingStatement = joinOutputParts(
        getStatementWithReplacements("concessionProbe", {
          concessionProbe: "refund",
        }),
        getCachedStatement("refundProbe"),
      );

      return concessionProbingStatement;
    }

    if (
      tokenType === "promoIssue" &&
      isCheckboxChecked("promoGuide")
    ) {
      return getCachedStatement("promoGuide");
    }

    if (
      tokenType === "promoIssue" &&
      isCheckboxChecked("issuingPromoCredits")
    ) {
      return getStatementWithReplacements("promoIssue", {
        refundAmount: getFormattedRefundAmount(),
      });
    }

    if (tokenType === "partialRefund") {
      const partialRefundStatement = getStatementWithReplacements(
        "partialRefund",
        {
          percentage:
            state.dynamicInputs.apologyTokenPartialRefundPercentage ||
            "[Enter percentage]",
          refundAmount: formatCurrencyAmount(
            state.dynamicInputs.apologyTokenPartialRefundAmount,
            "refundAmount",
          ),
        },
      );

      return buildTokenApologyOutput(partialRefundStatement);
    }

    const promotionalCreditStatement = getStatementWithReplacements(
      "promoProbing",
      { refundAmount: getFormattedRefundAmount() },
    );

    return buildTokenApologyOutput(promotionalCreditStatement);
  }

  function buildPreDeliveryOutput() {
    const selectedType = getSelectedValue("preDeliveryType", "eddNotPassed");

    return getCachedStatement(selectedType).replaceAll(
      "[Insert FRD]",
      getDynamicInputValue("date", "date"),
    );
  }

  function getPhotoVerificationDetails() {
    const selectedType = getSelectedValue(
      "photoVerificationType",
      "photoDamaged",
    );

    return {
      selectedType,
      information: photoVerificationInformationMap[selectedType],
      link: getDynamicInputValue("link", "link"),
      statementKey: isCheckboxChecked("photoEmailMedium")
        ? "imageUploadLater"
        : "uploadInformation",
    };
  }

  function buildPhotoVerificationOutput() {
    const { information, link, statementKey } = getPhotoVerificationDetails();

    return getStatementWithReplacements(statementKey, {
      information,
      link,
    });
  }

  function buildPhotoVerificationEmailOutput() {
    const { selectedType, link } = getPhotoVerificationDetails();
    const emailDetails = photoVerificationEmailDetails[selectedType];

    return [
      "Hello ${customerName},",
      "",
      emailDetails.context,
      "",
      emailDetails.instructions,
      link,
      "",
      emailDetails.guidelines,
      "",
      emailDetails.attachmentFallback,
      "",
      emailDetails.response,
      "",
      "Thank you,",
      "Amazon Customer Service",
    ].join("\n");
  }

  function buildEscalationOutput() {
    const selectedType = getMappedToolStatement(
      "escalations",
      escalationPersonMap,
      "escalationSupervisor",
    );

    const person = escalationPersonMap[selectedType];

    const statement = isCheckboxChecked("proceedEscalationTransfer")
      ? "Please hold while i transfer this chat to the ${person}"
      : getCachedStatement("requestSupervisorPreference");

    return replacePlaceholders(statement, {
      person,
    });
  }

  function buildCreatingReturnOutput() {
    return joinOutputParts(
      getCachedStatement("returnRequiredForRefund"),
      getCachedStatement("singleOption"),
    );
  }

  function buildReturnWaitOutput(statementKey) {
    const numberOfDays = getDynamicInputValue("numberOfDays", "numberOfDays");

    return getStatementWithReplacements(statementKey, {
      numberOfDays,

      returnDate: getDateAfterDays(
        state.dynamicInputs.returnDate,
        state.dynamicInputs.numberOfDays,
        "returnDate",
      ),
    });
  }

  function getStatusWaitDates() {
    const unit = isCheckboxChecked("businessDays") ? "businessDays" : "days";
    const waitDate = calculateDateAfterOffset({
      dateValue: state.dynamicInputs.returnFirstScan,
      offsetValue: state.dynamicInputs.numberOfDays,
      unit,
    });

    return {
      waitDate,
      contactDate: waitDate ? dateOffsetHandlers[unit](waitDate, 1) : null,
    };
  }

  function buildReturnStatusOutput() {
    const selectedVariant = getSelectedValue(
      "returnStatusVariant",
      "returnWait",
    );
    const isRepairStatus =
      getSelectedValue("returnStatusType", "returnStatus") === "repairStatus";
    const statusSubject = isRepairStatus ? "repair" : "return";
    const statusContext = isRepairStatus
      ? "the repair of your returned item and its delivery back to you"
      : "the refund for your returned item";
    const processingExplanation = isRepairStatus
      ? "Authorized technicians are still repairing your returned item and need the full processing timeframe to complete the repair and arrange its delivery back to you"
      : "The returns team is still processing your returned item and needs the full processing timeframe before the refund can be completed";
    const numberOfDays = getDynamicInputValue(
      "numberOfDays",
      "numberOfDays",
    );
    const { waitDate, contactDate } = getStatusWaitDates();

    return getStatementWithReplacements(selectedVariant, {
      numberOfDays,
      statusSubject,
      statusContext,
      processingExplanation,
      waitDate: waitDate ? formatDate(waitDate) : "[Enter wait date]",
      contactDate: contactDate
        ? formatDate(contactDate)
        : "[Enter contact date]",
    });
  }

  function buildReturnsOutput() {
    return buildSelectedOutput(
      "normalReturnsType",
      "probingReturn",
      {
        probingReturn: buildProbingReturnOutput,
        returnNecessary: () => getCachedStatement("returnUnwilling"),
        returnCreated: buildReturnCreatedOutput,
        returnFormat: buildReturnFormatOutput,
      },
    );
  }

  function buildRetrochargeOutput() {
    return getCachedStatement("retrochargeEmailIgnore");
  }

  function buildRepairProbingOutput() {
    return joinOutputParts(
      getCachedStatement("returnRequiredForRepair"),
      getCachedStatement("singleOption"),
    );
  }

  function buildRepairReturnCreatedOutput() {
    return getStatementWithReplacements("repairReturnConfirm", {
      returnFormatDescription: buildReturnFormatDescription(),
    });
  }

  function buildRepairsOutput() {
    return buildSelectedOutput(
      "repairWorkflowType",
      "probingRepair",
      {
        probingRepair: buildRepairProbingOutput,
        repairNecessary: () => getCachedStatement("repairUnwilling"),
        repairReturnCreated: buildRepairReturnCreatedOutput,
      },
    );
  }

  function buildReturnFormatDescription() {
    const carrierName = String(state.dynamicInputs.returnCarrierName || "").trim();
    const returnFormat = getSelectedValue("returnFormatType", "QR code");
    const formatDescription = returnFormat === "Label" ? "return label" : "QR code";

    return [carrierName, formatDescription].filter(Boolean).join(" ");
  }

  function buildReturnRefundMethod() {
    return getSelectedValue("returnRefundMethod", "originalPaymentMethod") ===
      "amazonGiftCard"
      ? "Amazon Gift Card balance"
      : "original payment method";
  }

  function buildProbingReturnOutput() {
    return joinOutputParts(
      getCachedStatement("returnRequiredForRefund"),
      getCachedStatement("singleOption"),
    );
  }

  function buildReturnFormatOutput() {
    return getStatementWithReplacements("returnFormat", {
      textFieldValue: String(state.dynamicInputs.returnCarrierName || "").trim(),
      returnFormat: getSelectedValue("returnFormatType", "QR code"),
      refundMethod: buildReturnRefundMethod(),
    }).replace(/\s{2,}/g, " ").trim();
  }

  function buildReturnCreatedOutput() {
    return getStatementWithReplacements("returnConfirm", {
      returnFormatDescription: buildReturnFormatDescription(),
      refundMethod: buildReturnRefundMethod(),
    });
  }

  function buildCreatingReturnVariantOutput() {
    return buildSelectedOutput("creatingReturnVariant", "creatingReturn", {
      creatingReturn: buildCreatingReturnOutput,
    });
  }


  function buildReturnDenialOutput() {
    return buildSelectedOutput("returnDenialVariant", "nonreturnable", {
      returnWindowExpired(selectedVariant) {
        return getStatementWithReplacements(selectedVariant, {
          date: getDynamicInputValue("date", "date"),
        });
      },
    });
  }

  function buildReturnLessConcessionOutput() {
    return buildSelectedOutput(
      "returnLessConcessionType",
      "concessionProbe",
      {
        concessionProbe: buildConcessionProbeOutput,
        refundIssue: buildRefundIssueOutput,
      },
    );
  }

  function buildReturnRequiredConcessionOutput() {
    const selectedType = getSelectedValue(
      "returnReqConcessionType",
      "concessionProbe",
    );

    if (selectedType !== "concessionProbe") {
      return getCachedStatement(selectedType);
    }

    const selectedStatements = returnRequiredStatementKeys.filter(
      isCheckboxChecked,
    );

    const promptKey =
      selectedStatements.length > 1 ? "multipleOption" : "singleOption";
    if (!selectedStatements.length) return "";

    const statements = selectedStatements.map((statementKey) =>
      buildReturnRequiredStatement(statementKey).trim(),
    );
    const statementBlock = statements.length === 1
      ? statements[0]
      : statements.map((statement, index) => `${index + 1}. ${statement}`).join("\n");
    const prompt = getCachedStatement(promptKey).trim();

    return `${statementBlock}\n\n${prompt}`;
  }

  function buildReturnRequiredStatement(statementKey) {
    const statement = getCachedStatement(statementKey);

    if (statementKey === "returnAvoid") {
      const probeKey = getSelectedValue("partialProbe", "partialRefund");
      const probeStatement =
        probeKey === "partialRefund"
          ? buildReturnRequiredStatement(probeKey)
          : getStatementWithReplacements("promoProbing", {
              refundAmount: getFormattedRefundAmount(),
            });

      return replacePlaceholders(statement, {
        partialProbe: probeStatement.replace(/[.!?]\s*$/, ""),
      });
    }

    if (statementKey !== "partialRefund") {
      return statement;
    }

    return replacePlaceholders(statement, {
      percentage:
        state.dynamicInputs.partialRefundPercentage || "[Enter percentage]",

      refundAmount: formatCurrencyAmount(
        state.dynamicInputs.partialRefundAmount,
        "refundAmount",
      ),
    });
  }

  function buildReplacementIssueOutput() {
    const selectedType = getSelectedValue(
      "replacementIssueType",
      "issueReplacement",
    );

    const statement = getCachedStatement(selectedType);

    if (!isCheckboxChecked("replacementDeliveryDate")) {
      return statement;
    }

    return joinOutputParts(
      statement,
      `The replacement will be delivered by ${getDynamicInputValue("replacementDeliveryDate", "delivery date")}, end of the day.`,
    );
  }

  function buildDnrItemMissingOutput() {
    const selectedScenario = getSelectedValue("dnrItemMissingScenario");

    const selectedResolution = getSelectedValue("dnrItemMissingResolution");

    if (!selectedScenario || !selectedResolution) {
      return getDefaultStatement() || "Please select appropriate inputs.";
    }

    if (selectedScenario === "wms30") {
      return getCachedStatement("wms30").replaceAll(
        "${concern}",
        dnrItemMissingConcernMap[selectedResolution] || "[Enter concern]",
      );
    }

    return getCachedStatement(selectedResolution);
  }

  return Object.freeze({
    notepad: buildNotepadOutput,

    annotations: createFormTemplateOutputBuilder("annotations"),

    dartTemplate: createFormTemplateOutputBuilder("dartTemplate"),

    dateCalculator: buildDateCalculatorOutput,

    dnrItemMissing: buildDnrItemMissingOutput,

    escalations: buildEscalationOutput,

    photoVerification: buildPhotoVerificationOutput,

    photoVerificationEmail: buildPhotoVerificationEmailOutput,

    preDelivery: buildPreDeliveryOutput,

    promoIssue: buildPromoIssueOutput,

    mfnOrders: buildMfnOrdersOutput,

    refundIssue: buildRefundIssueOutput,

    refundConfirmationEmail: buildRefundConfirmationEmailOutput,

    replacementIssue: buildReplacementIssueOutput,

    returns: buildReturnsOutput,

    retrocharge: buildRetrochargeOutput,

    returnStatus: buildReturnStatusOutput,

    repairs: buildRepairsOutput,

    returnDenials: buildReturnDenialOutput,

    returnLessConcession: buildReturnLessConcessionOutput,

    returnReqConcession: buildReturnRequiredConcessionOutput,
  });
}

export { createCustomOutputBuilders };
