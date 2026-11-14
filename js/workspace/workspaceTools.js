import { formTemplateFields } from "./formTemplateConfig.js";

/* =========================
   WORKSPACE TOOLS CONFIG
========================= */

const conditionalFragments = Object.freeze({
  specialPackage: {
    checkboxValue: "specialPackage",

    checkboxLabel: "Special Package",

    inputKey: "specialOccasion",

    inputLabel: "Special Occasion",

    inputPlaceholder: "Example: your daughter's birthday",

    statementKey: "specialOccasion",

    statementPlaceholder: "[Special Occasion]",
  },
});

const specialPackageConditionalFragments = Object.freeze([
  conditionalFragments.specialPackage,
]);

const acknowledgeInformationOption = {
  value: "acknowledgeInformation",

  label: "Acknowledge",
};

const acknowledgeInformationOverride = {
  checkboxValue: acknowledgeInformationOption.value,

  statementKey: "acknowledge",
};

const acknowledgeStatementOverrides = Object.freeze([
  acknowledgeInformationOverride,
]);

const informationPlaceholderSource = Object.freeze({
  placeholder: "information",

  radioGroupName: "probingType",

  fallbackValue: "information",
});

const inputBeforeCheckboxControlOrder = Object.freeze({
  input: 0,

  checkbox: 1,
});

const controlLayouts = Object.freeze({
  buttonAboveInput: "layout-button-above-input",

  checkboxDefaultAlign: "layout-checkbox-default-align",

  dateCalculator: "date-calculator-controls",

  returnRequiredConcession: "return-required-concession-controls",

  equalButtonRow: "layout-equal-button-row",

  notepad: "notepad-controls",

  stackedForm: "layout-stacked-form",

  threeColumnForm: "layout-three-column-form",

  twoColumnConditionalGrid: "layout-two-column-conditional-grid",

  // Two-column layouts keep the standard workspace control width while
  // allowing Return Format and Carrier to share a row.
  normalReturns: "normal-returns-controls",

  repairReturns: "repair-returns-controls",

  returnStatus: "return-status-controls",

  returnDenials: "return-denials-controls",
});

function option(label, value, config = {}) {
  return {
    label,

    value,

    ...config,
  };
}

const refundMethodOptions = Object.freeze([
  option("Original payment method", "originalPaymentMethod"),

  option("Amazon gift card", "amazonGiftCard"),
]);

const normalReturnDetailsVisibility = Object.freeze(
  visibleWhenAny(
    visibleWhenName("normalReturnsType", "returnFormat"),
    visibleWhenName("normalReturnsType", "returnCreated"),
  ),
);

const repairReturnCreatedVisibility = Object.freeze(
  visibleWhenName("repairWorkflowType", "repairReturnCreated"),
);

function statementInput(key) {
  return {
    statementInput: key,
  };
}

function visibleWhen(key, value, extra = {}) {
  return {
    [key]: value,

    ...extra,
  };
}

function visibleWhenName(name, value) {
  return visibleWhen("visibleWhenName", name, {
    visibleWhenValue: value,
  });
}

function visibleWhenCheckbox(value) {
  return visibleWhen("visibleWhenCheckbox", value);
}

function visibleWhenNotCheckbox(value) {
  return visibleWhen("visibleWhenNotCheckbox", value);
}

function visibleWhenAll(...conditions) {
  return {
    visibleWhenAll: JSON.stringify(conditions),
  };
}

function visibleWhenAny(...conditions) {
  return {
    visibleWhenAny: JSON.stringify(conditions),
  };
}

function visibleWhenStatement(value) {
  return visibleWhen("visibleWhenStatement", value);
}

function controlLayout(...classes) {
  return [...new Set(classes.flatMap((className) => className.split(" ")))]
    .filter(Boolean)
    .join(" ");
}

function copyHeaderAction({
  label = "Copy",
  target = "#workspaceOutput",
  builder = "",
  className = "",
  workspaceCopyButton = true,
  visibleWhenCheckbox = "",
} = {}) {
  return Object.freeze({
    type: "copy",
    label,
    target,
    builder,
    className,
    workspaceCopyButton,
    ...(visibleWhenCheckbox && { visibleWhenCheckbox }),
  });
}

const defaultHeaderActions = Object.freeze([copyHeaderAction()]);

const refundConfirmationHeaderActions = Object.freeze([
  conditionalEmailCopyAction(
    "refundConfirmationEmail",
    "generateRefundConfirmationEmail",
  ),
  copyHeaderAction(),
]);

function conditionalEmailCopyAction(builder, checkboxValue) {
  return copyHeaderAction({
    label: "Copy Email",
    builder,
    className: "hidden",
    workspaceCopyButton: false,
    visibleWhenCheckbox: checkboxValue,
  });
}

const photoVerificationHeaderActions = Object.freeze([
  conditionalEmailCopyAction("photoVerificationEmail", "photoEmailMedium"),
  copyHeaderAction(),
]);

function normalizeWorkspaceTool(tool) {
  return {
    ...tool,
    headerActions: Object.hasOwn(tool, "headerActions")
      ? tool.headerActions
      : defaultHeaderActions,
  };
}

function control(type, config) {
  return {
    type,

    config,
  };
}

function createSelectControl({
  title,
  id = "",
  name,
  selectedValue,
  options,
  wrapperDataset = {},
}) {
  return () =>
    control("select", {
      title,

      id,

      name,

      selectedValue,

      options,

      wrapperDataset,
    });
}

function createVisibleSelectControl(config, visibleName, visibleValue) {
  return createSelectControl({
    ...config,

    wrapperDataset: visibleWhenName(visibleName, visibleValue),
  });
}

function createCheckboxControl({
  options,
  className = "",
  wrapperDataset = {},
}) {
  return () =>
    control("checkbox", {
      options,

      className,

      wrapperDataset,
    });
}

function createControlFactory(type) {
  return (config) => () => control(type, config);
}

const createInputControl = createControlFactory("input");

const createInputRowControl = createControlFactory("inputRow");

const createStatementButtonControl = createControlFactory("statementButton");

function createStatementChoiceControl(
  selectedValue,
  options,
  name = "",
  wrapperDataset = {},
) {
  return createStatementButtonControl({
    selectedValue,

    options,

    name,

    wrapperDataset,
  });
}

function createVisibleStatementChoiceControl(
  selectedValue,
  options,
  name,
  visibleName,
  visibleValue,
) {
  return createStatementChoiceControl(
    selectedValue,
    options,
    name,
    visibleWhenName(visibleName, visibleValue),
  );
}

function createLinkButtonControl({
  label,
  href,
  className = "",
  wrapperDataset = {},
}) {
  return () =>
    control("link", {
      label,

      href,

      className,

      wrapperDataset,
    });
}

function controlsOf(...controlFactories) {
  return () => controlFactories.flatMap((createControl) => createControl());
}

function createDateInputControl({
  id,
  label = "Date",
  statementKey = "date",
  wrapperDataset,
  ...config
}) {
  return createInputControl({
    label,

    placeholder: "Example: June 5, 2026",

    id,

    dataset: statementInput(statementKey),

    wrapperDataset,

    ...config,
  });
}

function createFormTemplateControls(fields) {
  return controlsOf(
    ...fields.map((field) =>
      createInputControl({
        label: field.label,

        placeholder: field.placeholder || `Enter ${field.label}`,

        multiline: field.multiline || false,

        id: field.key,

        dataset: statementInput(field.key),
      }),
    ),
  );
}

function createFormTemplateTool(title, templateKey) {
  return {
    title,

    workspaceClass: `form-template-workspace form-template-${templateKey}`,

    customOutput: templateKey,

    hideOutput: true,

    controlsLayoutClass: controlLayout(
      controlLayouts.stackedForm,
      "form-template-controls",
    ),

    controls: createFormTemplateControls(formTemplateFields[templateKey]),
  };
}

function createNotepadTool() {
  return {
    title: "Notepad",

    customOutput: "notepad",

    hideOutput: true,

    controlsLayoutClass: controlLayouts.notepad,

    controls: controlsOf(() => control("notepad", {})),
  };
}

function createBellboyTool() {
  return {
    title: "BellBoy",

    customOutput: "bellboy",

    outputClass: "bellboy-output",

    workspaceClass: "bellboy-workspace",

    headerActions: [
      { type: "bellboy-location-search" },
      { type: "button", label: "Add NPT Alarm", dataset: { bellboyAddAlarm: "" } },
      { type: "button", label: "Reset BellBoy", dataset: { bellboyReset: "" } },
    ],

    controlsLayoutClass: "bellboy-controls-layout",

    controls: controlsOf(() => control("bellboy", {})),
  };
}

function createPastVersionsTool() {
  return {
    title: "Past Versions",

    headerActions: [],

    richOutput: {
      textBefore: "For feedback and suggestions, please contact ",
      linkText: "Shrikanth K",
      href: "https://phonetool.amazon.com/users/skondamc",
    },

    controlsLayoutClass: controlLayouts.equalButtonRow,

    controls: controlsOf(
      createLinkButtonControl({
        label: "Version-1",
        href: "https://drive-render.corp.amazon.com/view/skondamc@/Past%20Version/Chat%20Script.html",
      }),

      createLinkButtonControl({
        label: "Version-2",
        href: "https://drive-render.corp.amazon.com/view/skondamc@/Past%20Version/Chat%20Script%20v2.html",
      }),

      createLinkButtonControl({
        label: "Version-3",
        href: "https://drive-render.corp.amazon.com/view/skondamc@/Past%20Version/Retail%20Script%201/Retail%20Script.html",
      }),
    ),
  };
}

function noControls() {
  return [];
}



function dateCalculatorControls() {
  return controlsOf(
    createSelectControl({
      title: "Operation",

      name: "dateCalculatorOperation",

      selectedValue: "add",

      options: [option("Future Date", "add"), option("Past Date", "subtract")],
    }),

    createInputControl({
      label: "Input date",

      type: "date",

      id: "dateCalculatorInputDate",

      dataset: statementInput("dateCalculatorInputDate"),
    }),

    createInputControl({
      label: "Number of days",

      type: "number",

      placeholder: "Example: 14",

      id: "dateCalculatorDays",

      dataset: statementInput("dateCalculatorDays"),
    }),

    createCheckboxControl({
      options: [option("Business days", "businessDays")],

      className: "workspace-inline-checkbox",
    }),
  );
}

function acknowledgeControls() {
  return [
    control("checkbox", {
      className: "workspace-inline-checkbox",

      options: [acknowledgeInformationOption],
    }),
  ];
}

function refundIssueControls() {
  return controlsOf(
    createSelectControl({
      title: "Refund method",

      name: "refundMethod",

      selectedValue: "originalPaymentMethod",

      options: refundMethodOptions,
    }),

    createCheckboxControl({
      options: [
        option(
          "Generate confirmation Email",
          "generateRefundConfirmationEmail",
        ),
      ],
    }),

    createInputControl({
      label: "Refund Amount",

      placeholder: "Example: 12.99",

      id: "refundAmount",

      dataset: statementInput("refundAmount"),
    }),

    createInputControl({
      label: "Enter order ID",

      placeholder: "Example: 123-1234567-1234567",

      id: "refundConfirmationOrderId",

      className: "hidden",

      dataset: statementInput("orderId"),

      wrapperDataset: visibleWhenCheckbox("generateRefundConfirmationEmail"),
    }),
  );
}

function promoRefundAmountControl(wrapperDataset = {}, className = "") {
  return createInputControl({
    label: "Promo amount",

    placeholder: "Example: 12.99",

    id: "promoRefundAmount",

    className,

    dataset: statementInput("refundAmount"),

    wrapperDataset,
  });
}

function returnStatusControls() {
  return controlsOf(
    createSelectControl({
      title: "Status",

      name: "returnStatusType",

      selectedValue: "returnStatus",

      options: [
        option("Return Status", "returnStatus"),
        option("Repair Status", "repairStatus"),
      ],
    }),

    createStatementChoiceControl(
      "returnWait",
      [
        option("Wait Date", "returnWait"),
        option("Wait Necessary", "waitDenial"),
      ],
      "returnStatusVariant",
    ),

    createInputControl({
      label: "Enter number of Days",

      type: "number",

      placeholder: "Example: 14",

      id: "returnStatusNumberOfDays",

      dataset: statementInput("numberOfDays"),
    }),

    createInputControl({
      label: "Return First Scan",

      type: "date",

      id: "returnStatusFirstScan",

      dataset: statementInput("returnFirstScan"),
    }),

    createCheckboxControl({
      className: "workspace-inline-checkbox",

      options: [option("Business days", "businessDays")],
    }),
  );
}

function createRadioStatementTool({ title, statementKey, options }) {
  return {
    title,

    statementKey,

    controls: controlsOf(createStatementChoiceControl(statementKey, options)),
  };
}

function createAssuranceTool({
  title,
  statementKey,
  options,
  conditionalFragments,
  controls = noControls,
  controlsLayoutClass = "",
  ...config
}) {
  const toolControlsLayoutClass = conditionalFragments
    ? controlLayout(controlsLayoutClass, controlLayouts.buttonAboveInput)
    : controlsLayoutClass;

  return {
    title,

    statementKey,

    appendAssurance: true,

    ...(conditionalFragments && { conditionalFragments }),

    ...(toolControlsLayoutClass && {
      controlsLayoutClass: toolControlsLayoutClass,
    }),

    ...config,

    controls: options
      ? controlsOf(createStatementChoiceControl(statementKey, options))
      : controls,
  };
}

function createApologyTool({ title, statementKey, options }) {
  return createAssuranceTool({
    title,

    statementKey,

    options,

    conditionalFragments: specialPackageConditionalFragments,
  });
}

function createGroupedStatementTool({
  title,
  statementKey,
  selectedValue = statementKey,
  groupName,
  options,
  additionalControls = [],
  controlsLayoutClass = "",
  ...config
}) {
  const toolControlsLayoutClass = additionalControls.length
    ? controlLayout(controlsLayoutClass, controlLayouts.buttonAboveInput)
    : controlsLayoutClass;

  return {
    title,

    ...(statementKey && { statementKey }),

    statementRadioGroupName: groupName,

    ...(toolControlsLayoutClass && {
      controlsLayoutClass: toolControlsLayoutClass,
    }),

    ...config,

    controls: controlsOf(
      ...(options
        ? [createStatementChoiceControl(selectedValue, options, groupName)]
        : []),
      ...additionalControls,
    ),
  };
}

function returnLessConcessionCheckboxControl(wrapperDataset) {
  return createCheckboxControl({
    options: [
      option("Refund", "returnLessRefund"),
      option("Replacement", "returnLessReplacement"),
    ],
    wrapperDataset,
  });
}

function createAcknowledgingProbingTool({
  title,
  statementKey,
  groupName,
  options,
  placeholderSource = informationPlaceholderSource,
  beforeAcknowledgeControls = [],
  afterAcknowledgeControls = [],
  controlsLayoutClass = "",
  ...config
}) {
  const toolControlsLayoutClass = afterAcknowledgeControls.length
    ? controlLayout(controlsLayoutClass, controlLayouts.buttonAboveInput)
    : controlsLayoutClass;

  return {
    title,

    statementKey,

    ...(groupName && { statementRadioGroupName: groupName }),

    statementOverrides: acknowledgeStatementOverrides,

    placeholderSource,

    ...(toolControlsLayoutClass && {
      controlsLayoutClass: toolControlsLayoutClass,
    }),

    ...config,

    controls: controlsOf(
      ...(options
        ? [createStatementChoiceControl(statementKey, options, groupName)]
        : []),
      ...beforeAcknowledgeControls,
      acknowledgeControls,
      ...afterAcknowledgeControls,
    ),
  };
}

const workspaceToolConfigs = Object.freeze({
  pastVersions: createPastVersionsTool(),

  notepad: createNotepadTool(),

  bellboy: createBellboyTool(),

  annotations: createFormTemplateTool("Annotations", "annotations"),

  dartTemplate: createFormTemplateTool("DART Template", "dartTemplate"),

  dateCalculator: {
    title: "Date Calculator",

    headerActions: [],

    customOutput: "dateCalculator",

    outputClass: "date-calculator-output",

    controlsLayoutClass: controlLayout(
      controlLayouts.threeColumnForm,
      controlLayouts.dateCalculator,
    ),

    controls: dateCalculatorControls(),
  },

  opening: createRadioStatementTool({
    title: "Opening Statements",

    statementKey: "firstContact",

    options: [
      option("First contact", "firstContact"),

      option("Multiple contact", "multipleContact"),
    ],
  }),

  holdUnhold: createRadioStatementTool({
    title: "Hold / Unhold Statements",

    statementKey: "hold",

    options: [
      option("Hold ", "hold"),

      option("Unhold", "unhold"),

      option("Additional 2 minutes", "additionalHoldTime"),
    ],
  }),

  generalApology: createAssuranceTool({
    title: "General Apology",

    statementKey: "generalApology",

    controls: controlsOf(
      createInputControl({
        label: "Enter Concern",

        placeholder: "Example: that your package arrived late",

        id: "generalApologyConcern",

        dataset: statementInput("concern"),
      }),
    ),
  }),
  DNR: createApologyTool({
    title: "DNR Apology",
    statementKey: "DNRNR",
    options: [
      option("Not Received", "DNRNR"),

      option("Package Missing", "DNREM"),
    ],
  }),
  itemMissing: createApologyTool({
    title: "Item missing Apology",

    statementKey: "itemMissing",
    options: [
      option("Item missing", "itemMissing"),

      option("Empty package", "emptyPackage"),

      option("Part missing", "partMissing"),
    ],
  }),
  preDelivery: createApologyTool({
    title: "Delayed Package Apology",

    statementKey: "eddPassed",
    options: [
      option("Delayed Package", "eddPassed"),

      option("Lost in transit", "packageLost"),

      option("Returning back", "undeliverable"),
    ],
  }),
  returnsApology: createAssuranceTool({
    title: "Returns Apology",

    statementKey: "returns",
  }),
  wrongItem: createApologyTool({
    title: "Wrong Item Apology",

    statementKey: "wrongItem",
    options: [
      option("Wrong Item", "wrongItem"),

      option("Item not as expected", "itemExpectations"),
    ],
  }),

  damagedDefective: createAssuranceTool({
    title: "Damaged/Defective Apology",

    statementKey: "damagedItem",

    conditionalFragments: specialPackageConditionalFragments,

    appendFragments: [
      {
        checkboxValue: "outerDamage",

        statementKey: "outerDamage",
      },

      {
        checkboxValue: "leakingDamage",

        statementKey: "leakingDamage",
      },
    ],

    controls: controlsOf(
      createStatementChoiceControl("damagedItem", [
        option("Damaged Item", "damagedItem"),

        option("Defective Item", "defectiveItem"),

        option("Not Working", "notWorking"),
      ]),

      createCheckboxControl({
        options: [
          option("Packaging damage", "outerDamage"),

          option("Leaking / Spilled", "leakingDamage"),
        ],
      }),
    ),
  }),
  unidentifiedCharge: createAssuranceTool({
    title: "Unknown charge Apology",

    statementKey: "unidentifiedCharge",
  }),
  retroCharge: createAssuranceTool({
    title: "RetroCharge Apology",

    statementKey: "retroCharged",

    controlsLayoutClass: controlLayouts.buttonAboveInput,

    controls: controlsOf(
      createStatementChoiceControl("retroCharged", [
        option("Already Charged", "retroCharged"),

        option("Received charge email", "retroChargeEmail"),
      ]),

      createInputControl({
        label: "Returned date",

        placeholder: "Example: January 15, 2026",

        id: "retroChargeDate",

        dataset: statementInput("date"),
      }),
    ),
  }),
  generalProbing: createAcknowledgingProbingTool({
    title: "Order Probing",

    statementKey: "defaultProbing",

    placeholderSource: {
      ...informationPlaceholderSource,

      mappings: {
        orderId: "Order-ID",

        itemName: "Item Name",
      },
    },

    beforeAcknowledgeControls: [
      createStatementChoiceControl(
        "orderId",
        [option("Order-ID", "orderId"), option("Item Name", "itemName")],
        "probingType",
      ),
    ],
  }),
  issueProbing: {
    title: "Issue Probing",

    statementKey: "issueClarification",

    controls: controlsOf(
      createStatementChoiceControl("issueClarification", [
        option("Concern unclear ", "issueClarification"),

        option("Reason for return", "returnReasonProbing"),
      ]),
    ),
  },
  dnrIMprobing: createAcknowledgingProbingTool({
    title: "DNR/IM Probing",

    statementKey: "dnrProbe",

    groupName: "probingType",

    options: [
      option("DNR Probing", "dnrProbe"),

      option("IM Probing", "imProbe"),

      option("Issue clarification", "probeConfirm"),
    ],
  }),

  addressProbing: createAcknowledgingProbingTool({
    title: "Address Probing",

    statementKey: "addressProbing",
  }),
  itemNameProbing: createAcknowledgingProbingTool({
    title: "Item Name Probing ",

    statementKey: "itemNameProbing",

    controlRenderOrder: inputBeforeCheckboxControlOrder,

    placeholderSource: {
      placeholder: "information",

      fallbackValue: "item name",
    },

    beforeAcknowledgeControls: [
      createInputControl({
        label: "Enter Item Name",

        placeholder: "Item name ",

        id: "itemName",

        dataset: statementInput("itemName"),
      }),
    ],
  }),
  lateContactProbing: createAcknowledgingProbingTool({
    title: "Late Contact Probing",

    statementKey: "rwExpired",

    groupName: "probingType",

    options: [
      option("Return Window expired", "rwExpired"),

      option("30 days delivery passed", "wms30Passed"),
    ],
    afterAcknowledgeControls: [
      createInputControl({
        label: "Enter Date",

        placeholder: "25-November-2025 ",

        id: "date",

        dataset: statementInput("date"),
      }),
    ],
  }),
  unknownChargeProbing: createAcknowledgingProbingTool({
    title: "Unknown Charge Probing",

    statementKey: "unknownChargeDigits",

    groupName: "probingType",

    placeholderSource: {
      ...informationPlaceholderSource,

      mappings: {
        unknownChargeDigits: "last 4 digits",

        unknownChargeID: "Charge ID",
      },
    },

    options: [
      option("Last 4 digits", "unknownChargeDigits"),

      option("Charge ID", "unknownChargeID"),
    ],
  }),
  dnrItemMissing: {
    title: "DNR / Item Missing",

    statementKey: "default",

    statementRadioGroupName: "dnrItemMissingScenario",

    customOutput: "dnrItemMissing",

    controls: controlsOf(
      createSelectControl({
        title: "Select scenario",

        name: "dnrItemMissingScenario",

        selectedValue: "",

        options: [
          option("30 days passed", "wms30"),

          option("FRD active", "frdActive"),
        ],
      }),

      createVisibleSelectControl(
        {
          title: "Concern type",

          name: "dnrItemMissingResolution",

          selectedValue: "",

          options: [
            option("DNR", "dnr"),
            option("Item missing", "itemMissing"),
          ],
        },
        "dnrItemMissingScenario",
        "wms30",
      ),

      createVisibleSelectControl(
        {
          title: "FRD response",

          name: "dnrItemMissingResolution",

          selectedValue: "",

          options: [
            option("FRD wait", "dnrFrdActive"),

            option("POD present", "podPresent"),
          ],
        },
        "dnrItemMissingScenario",
        "frdActive",
      ),

      createDateInputControl({
        id: "dnrItemMissingDate",
      }),
    ),
  },
  preDeliverySupport: createGroupedStatementTool({
    title: "Pre-delivery",

    statementKey: "eddNotPassed",

    groupName: "preDeliveryType",

    customOutput: "preDelivery",

    options: [
      option("EDD not passed", "eddNotPassed"),

      option("FRD active", "pdFrdActive"),

      option("Not yet shipped", "notYetShipped"),

      option("Unable to cancel", "cancelDelivery"),
    ],

    additionalControls: [
      createDateInputControl({
        id: "preDeliveryDate",

        wrapperDataset: visibleWhenAny(
          visibleWhenName("preDeliveryType", "eddNotPassed"),
          visibleWhenName("preDeliveryType", "pdFrdActive"),
        ),
      }),
    ],
  }),
  photoVerification: {
    title: "Photo Verification",

    statementKey: "uploadInformation",

    customOutput: "photoVerification",

    headerActions: photoVerificationHeaderActions,

    controlsLayoutClass: controlLayout(
      controlLayouts.buttonAboveInput,
      controlLayouts.checkboxDefaultAlign,
    ),

    controls: controlsOf(
      createStatementChoiceControl(
        "photoDamaged",
        [
          option("Damaged / Defective", "photoDamaged"),

          option("Return receipt", "photoReturnReceipt"),
        ],
        "photoVerificationType",
      ),

      createCheckboxControl({
        className: "workspace-inline-checkbox",

        options: [
          option("Email Medium", "photoEmailMedium", {
            resetStatementInputs: ["link"],
          }),
        ],
      }),

      createInputControl({
        label: "Enter Amazon Link",

        placeholder: "Example: https://www.amazon.com/...",

        id: "amazonLink",

        dataset: statementInput("link"),
      }),
    ),
  },
  returns: {
    title: "Returns",

    statementKey: "returnRequiredForRefund",

    customOutput: "returns",

    controlsLayoutClass: controlLayouts.normalReturns,

    controls: controlsOf(
      createStatementChoiceControl(
        "probingReturn",
        [
          option("Probing Return", "probingReturn"),
          option("Return Necessary", "returnNecessary"),
          option("Return Format", "returnFormat"),
          option("Return Created", "returnCreated"),
        ],
        "normalReturnsType",
      ),

      createSelectControl({
        title: "Refund method",

        name: "returnRefundMethod",

        selectedValue: "originalPaymentMethod",

        options: refundMethodOptions,

        wrapperDataset: normalReturnDetailsVisibility,
      }),

      createSelectControl({
        title: "Return format",

        name: "returnFormatType",

        selectedValue: "QR code",

        options: [
          option("QR code", "QR code"),
          option("Label", "Label"),
        ],

        wrapperDataset: normalReturnDetailsVisibility,
      }),

      createInputControl({
        label: "Enter carrier name",

        placeholder: "Carrier name",

        id: "returnCarrierName",

        dataset: statementInput("returnCarrierName"),

        wrapperDataset: normalReturnDetailsVisibility,
      }),
    ),
  },
  retrocharge: {
    title: "Retrocharge",

    statementKey: "retrochargeEmailIgnore",

    customOutput: "retrocharge",

    controls: controlsOf(),
  },
  returnStatus: {
    title: "Return Status",

    statementKey: "returnWait",

    customOutput: "returnStatus",

    controlsLayoutClass: controlLayouts.returnStatus,

    controlRenderOrder: inputBeforeCheckboxControlOrder,

    controls: returnStatusControls(),
  },
  returnDenials: {
    title: "Return Denials",

    statementKey: "nonreturnable",

    customOutput: "returnDenials",

    controlsLayoutClass: controlLayouts.returnDenials,

    controls: controlsOf(
      createStatementChoiceControl(
        "nonreturnable",
        [
          option("Non-Returnable", "nonreturnable"),
          option("Return Window Expired", "returnWindowExpired"),
        ],
        "returnDenialVariant",
      ),

      createInputControl({
        label: "Enter RW expiry date",

        type: "text",

        placeholder: "Example: October 9, 2026",

        id: "returnWindowExpiredDate",

        dataset: statementInput("date"),

        wrapperDataset: visibleWhenName(
          "returnDenialVariant",
          "returnWindowExpired",
        ),
      }),
    ),
  },
  repairs: {
    title: "Repairs",

    statementKey: "returnRequiredForRepair",

    customOutput: "repairs",

    controlsLayoutClass: controlLayouts.repairReturns,

    controls: controlsOf(
      createStatementChoiceControl(
        "probingRepair",
        [
          option("Probing Repair", "probingRepair"),
          option("Repair Necessary", "repairNecessary"),
          option("Return Created", "repairReturnCreated"),
        ],
        "repairWorkflowType",
      ),

      createSelectControl({
        title: "Return format",

        name: "returnFormatType",

        selectedValue: "QR code",

        options: [
          option("QR code", "QR code"),
          option("Label", "Label"),
        ],

        wrapperDataset: repairReturnCreatedVisibility,
      }),

      createInputControl({
        label: "Enter carrier name",

        placeholder: "Carrier name",

        id: "returnCarrierName",

        dataset: statementInput("returnCarrierName"),

        wrapperDataset: repairReturnCreatedVisibility,
      }),
    ),
  },
  returnLessConcession: createGroupedStatementTool({
    title: "Return-less Concession Probe",

    statementKey: "concessionProbe",

    groupName: "returnLessConcessionType",

    customOutput: "returnLessConcession",

    options: [
      option("Concession type probing", "concessionProbe"),
      option("Return-less Concession", "keepDonateDisposeStatements"),
    ],

    additionalControls: [
      returnLessConcessionCheckboxControl(
        visibleWhenName("returnLessConcessionType", "concessionProbe"),
      ),
    ],
  }),
  returnReqConcession: createGroupedStatementTool({
    title: "Return-required Concession Probe",

    controlsLayoutClass: controlLayouts.returnRequiredConcession,

    controlRenderOrder: {
      button: 0,

      checkbox: 1,

      select: 2,

      inputRow: 3,

      input: 3,
    },

    selectedValue: "concessionProbe",

    groupName: "returnReqConcessionType",

    customOutput: "returnReqConcession",

    options: [
      option("Concession type probing", "concessionProbe"),

      option("Return Necessary", "returnUnwilling"),

      option("Repair necessary", "repairUnwilling"),

      option("Replacement Unavailable", "replacementUnavailable"),

      option("Part missing replacement", "replacementParts"),
    ],

    additionalControls: [
      createCheckboxControl({
        options: [
          option("Return", "returnRequiredForRefund"),

          option("Replacement", "returnRequiredForReplacement"),

          option("Return Avoid", "returnAvoid"),

          option("Repair", "returnRequiredForRepair"),
        ],

        wrapperDataset: visibleWhenName(
          "returnReqConcessionType",
          "concessionProbe",
        ),
      }),

      createSelectControl({
        title: "Partial probe",

        id: "partialProbe",

        name: "partialProbe",

        selectedValue: "partialRefund",

        options: [
          option("Partial Refund", "partialRefund"),

          option("Promotional credits", "promoProbing"),
        ],

        wrapperDataset: visibleWhenAll(
          visibleWhenName("returnReqConcessionType", "concessionProbe"),
          visibleWhenCheckbox("returnAvoid"),
        ),
      }),

      createInputRowControl({
        className: "hidden partial-probe-inputs",

        wrapperDataset: visibleWhenAll(
          visibleWhenName("returnReqConcessionType", "concessionProbe"),
          visibleWhenCheckbox("returnAvoid"),
          visibleWhenName("partialProbe", "partialRefund"),
        ),

        fields: [
          {
            label: "Partial refund %",

            placeholder: "Example: 20",

            id: "partialRefundPercentage",

            dataset: statementInput("partialRefundPercentage"),
          },

          {
            label: "Refund amount",

            placeholder: "Example: 12.99",

            id: "partialRefundAmount",

            dataset: statementInput("partialRefundAmount"),
          },
        ],
      }),

      promoRefundAmountControl(
        visibleWhenAll(
          visibleWhenName("returnReqConcessionType", "concessionProbe"),
          visibleWhenCheckbox("returnAvoid"),
          visibleWhenName("partialProbe", "promoProbing"),
        ),
        "partial-probe-inputs",
      ),

      createInputRowControl({
        className: "hidden replacement-parts-inputs",

        wrapperDataset: visibleWhenName(
          "returnReqConcessionType",
          "replacementParts",
        ),

        fields: [
          {
            label: "Delivery date",

            placeholder: "Example: June 5, 2026",

            id: "replacementPartsDeliveryDate",

            dataset: statementInput("deliveryDate"),
          },

          {
            label: "Return window",

            placeholder: "Example: July 5, 2026",

            id: "replacementPartsReturnWindow",

            dataset: statementInput("returnWindow"),
          },
        ],
      }),
    ],
  }),
  issuingRefund: {
    title: "Issuing Refund",

    statementKey: "refundIssue",

    customOutput: "refundIssue",

    headerActions: refundConfirmationHeaderActions,

    controlsLayoutClass: controlLayouts.twoColumnConditionalGrid,

    controls: refundIssueControls(),
  },
  mfnOrders: createGroupedStatementTool({
    title: "MFN Orders",

    statementKey: "sellerContact",

    customOutput: "mfnOrders",

    options: [
      option("Contact Seller", "sellerContact"),

      option("48 hour Wait", "wait48hours"),

      option("Prepaid return label", "mfnReturnShipping"),

      option("Claim initiated", "claimInitiated"),
    ],

    additionalControls: [
      createDateInputControl({
        label: "Seller initial contact date",

        id: "mfnSellerContactDate",

        wrapperDataset: visibleWhenStatement("wait48hours"),
      }),
    ],
  }),
  issuingPromo: createGroupedStatementTool({
    title: "Token Apology",

    statementKey: "promoIssue",

    groupName: "apologyTokenType",

    customOutput: "promoIssue",

    additionalControls: [
      createSelectControl({
        title: "Type of Apology token",

        name: "apologyTokenType",

        selectedValue: "promoIssue",

        options: [
          option("Promotional Credits", "promoIssue"),
          option("Partial Refund", "partialRefund"),
        ],
      }),

      createCheckboxControl({
        options: [
          option("Issuing Promotional Credits", "issuingPromoCredits"),
          option("Promo Guide", "promoGuide"),
        ],
        wrapperDataset: visibleWhenName("apologyTokenType", "promoIssue"),
      }),

      createCheckboxControl({
        options: [option("Concession Type Probing", "concessionTypeProbing")],
        wrapperDataset: visibleWhenName("apologyTokenType", "partialRefund"),
      }),

      promoRefundAmountControl(
        visibleWhenName("apologyTokenType", "promoIssue"),
      ),

      createInputRowControl({
        className: "apology-token-partial-refund-inputs",

        wrapperDataset: visibleWhenAll(
          visibleWhenName("apologyTokenType", "partialRefund"),
          visibleWhenNotCheckbox("concessionTypeProbing"),
        ),

        fields: [
          {
            label: "Partial refund %",

            placeholder: "Example: 20",

            id: "apologyTokenPartialRefundPercentage",

            dataset: statementInput("apologyTokenPartialRefundPercentage"),
          },
          {
            label: "Refund amount",

            placeholder: "Example: 12.99",

            id: "apologyTokenPartialRefundAmount",

            dataset: statementInput("apologyTokenPartialRefundAmount"),
          },
        ],
      }),

    ],
    controlsLayoutClass: "token-apology-controls",
  }),
  issuingReplacement: createGroupedStatementTool({
    title: "Issuing replacement",

    statementKey: "issueReplacement",

    groupName: "replacementIssueType",

    customOutput: "replacementIssue",

    options: [
      option("Normal replacement", "issueReplacement"),

      option("Return required replacement", "returnrequiredReplacementissue"),
    ],

    additionalControls: [
      createCheckboxControl({
        options: [
          option("Replacement Delivery date", "replacementDeliveryDate"),
        ],
      }),

      createDateInputControl({
        label: "Delivery date",

        id: "replacementDeliveryDate",

        className: "hidden",

        statementKey: "replacementDeliveryDate",

        wrapperDataset: visibleWhenCheckbox("replacementDeliveryDate"),
      }),
    ],
  }),
  leadContact: createRadioStatementTool({
    title: "Lead Contact",

    statementKey: "leadInitial",

    options: [
      option("Lead Contact", "leadInitial"),

      option("DART still reviewing", "leadershipReview"),
    ],
  }),
  askingMore: createRadioStatementTool({
    title: "Asking More",

    statementKey: "askingMore",

    options: [],
  }),
  transfers: createRadioStatementTool({
    title: "Transfers",

    statementKey: "transfers",

    options: [],
  }),
  escalations: {
    title: "Escalations",

    statementKey: "requestSupervisorPreference",

    customOutput: "escalations",

    controlsLayoutClass: controlLayouts.buttonAboveInput,

    controls: controlsOf(
      createStatementChoiceControl("escalationSupervisor", [
        option("Supervisor", "escalationSupervisor"),

        option("Manager", "escalationManager"),
      ]),

      createCheckboxControl({
        options: [option("Proceed transfer", "proceedEscalationTransfer")],
      }),
    ),
  },
  falsePromises: createRadioStatementTool({
    title: "False Promises",

    statementKey: "falsePromise",

    options: [
      option("Denying the promise", "falsePromise"),

      option("Denying Vehemently", "cannotHonorAdjustment"),
    ],
  }),
  closingThanks: createRadioStatementTool({
    title: "Closing ",

    statementKey: "closingThanks",

    options: [],
  }),
  idleStatements: createRadioStatementTool({
    title: "Idle ",

    statementKey: "idleStatements",

    options: [],
  }),
});

const workspaceTools = Object.freeze(
  Object.fromEntries(
    Object.entries(workspaceToolConfigs).map(([toolName, tool]) => [
      toolName,
      normalizeWorkspaceTool(tool),
    ]),
  ),
);

export { workspaceTools };
