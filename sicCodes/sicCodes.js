/* Standalone DE SIC codes branch tree */
"use strict";

import { createThemeController } from "../js/shell/theme.js";

const initialOutput = Object.freeze({
  code: "Select a code",
  label: "Start with Issue Code - 1.",
});
const animationTiming = Object.freeze({
  branchStepMs: 50,
  optionStepMs: 20,
  maxOptionDelayMs: 180,
});

const giftCardIdentityOptions = Object.freeze([
  "Question about collecting identity information",
  "Question about document requirement",
]);

const membershipVerificationOptions = Object.freeze([
  "Questions about new registration/verification",
  "Reactivate membership",
  "Contract term expired / not eligible",
  "Documents / information incorrect",
  "Other questions about membership",
]);

const packagingDamageOptions = Object.freeze([
  "Outer packaging damaged",
  "Product packaging damaged",
  "Packaging undamaged, product damaged",
  "No return for safety reasons",
]);

const wrongOrMissingItemOptions = Object.freeze([
  "Received another customer's order",
  "Manufacturer packaging matches the website but contains a different item",
  "Received wrong item",
  "Item completely missing, packaging is undamaged",
  "Item completely missing, packaging is damaged",
]);

const itemExpectationsOptions = Object.freeze([
  "Packaging and item match, but item differs from the product description",
  "Incorrect or insufficient product description",
  "Item is not compatible",
  "Part or accessory is missing from the product packaging",
  "Item contains data from previous owner",
  "Item received with signs of use",
  "Does not fit / do not like it",
  "Item does not meet expectations",
  "Received additional item",
]);

const primeDeliveryPromiseOptions = Object.freeze([
  "Prime delivery promise one business day after shipment",
  "Prime delivery promise more than one business day after shipment",
  "No Prime delivery promise",
]);

const promotionTermsOptions = Object.freeze([
  "Questions about promotion terms and conditions",
  "Other questions about promotions",
]);

const issueBranches = Object.freeze([
  {
    id: "issue1",
    level: 0,
    title: "Issue Code - 1",
    options: Object.freeze([
      "Related to an order",
      "Not related to an order",
      "Non-Prime subscription",
      "Data protection / privacy",
      "Minor account holders",
      "Incomplete contact",
      "Internal contact",
      "Emergency codes",
    ]),
  },
  {
    id: "issue2OrderRelated",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 0 }),
    options: Object.freeze([
      "Where is my order?",
      "Problem with an order",
      "Payment inquiry",
      "Marketplace or selling partner / A-to-z Guarantee claim",
      "Change order",
      "Promotions",
      "Questions about recycling",
      "Returns and refunds",
      "Repair service",
      "Gift cards and top-up",
      "Problem with large appliance service",
      "Other question about the order",
    ]),
  },
  {
    id: "issue2NotOrderRelated",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 1 }),
    options: Object.freeze([
      "Questions before ordering",
      "Update information in customer account",
      "Prime membership",
      "Feedback about a seller / suspicious seller activity",
      "Promotions",
      "Invitation-based ordering process",
      "Gift cards and top-up",
      "Unknown charge",
      "Subscribe & Save",
      "Trade-In",
      "Other questions not related to an order",
      "AI-generated response",
    ]),
  },
  {
    id: "issue2NonPrimeSubscription",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 2 }),
    options: Object.freeze([
      "Amazon Channels Prime Video Channels",
      "Amazon Music Unlimited",
      "Amazon Drive",
      "Kindle Unlimited",
      "Amazon Kids+",
      "Newspapers, magazines, and newsstand",
      "Appstore",
      "Alexa Skills",
      "Digital software and video games subscription",
    ]),
  },
  {
    id: "issue3PrimeVideoChannels",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NonPrimeSubscription",
      level: 1,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Cancel subscription",
      "Change subscription",
      "Cancel / disable automatic renewal",
    ]),
  },
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `issue3NonPrimeSubscriptionCancel${index + 1}`,
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NonPrimeSubscription",
      level: 1,
      optionIndex: index + 1,
    }),
    options: Object.freeze(["Cancel / disable automatic renewal"]),
  })),
  {
    id: "issue2DataProtectionPrivacy",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 3 }),
    options: Object.freeze([
      "DSAR (request for information about personal data)",
      "ACDD",
      "Bereavement support",
      "Power of Attorney (POA)",
    ]),
  },
  {
    id: "issue3Dsar",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2DataProtectionPrivacy",
      level: 1,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Guide customer to self-service via DSAR",
      "Data portability request",
      "Problem with received DSAR",
      "Non-account holder",
      "Questions about personal data",
    ]),
  },
  {
    id: "issue3Acdd",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2DataProtectionPrivacy",
      level: 1,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Guide customer to self-service via ACDD",
      "Account closure request",
      "Return after account closure",
      "Wrong account closed",
      "Customer cannot access closed account",
    ]),
  },
  {
    id: "issue3BereavementSupport",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2DataProtectionPrivacy",
      level: 1,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Bereavement verification sent",
      "Wrong account closed",
    ]),
  },
  {
    id: "issue3PowerOfAttorney",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2DataProtectionPrivacy",
      level: 1,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Cannot access POA account",
    ]),
  },
  {
    id: "issue2MinorAccountHolders",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 4 }),
    options: Object.freeze([
      "Minor account reported by parents",
      "Minor account reported by account holders",
      "Minor account has a gift card",
      "Returns and refunds for minors",
      "Minor account was closed",
      "Problems accessing minor accounts",
    ]),
  },
  {
    id: "issue2IncompleteContact",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 5 }),
    options: Object.freeze([
      "Transfer to another department",
      "Contact disconnected",
      "Verification failed",
    ]),
  },
  {
    id: "issue3ContactDisconnected",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2IncompleteContact",
      level: 1,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Chat/call disconnected",
      "Customer could not be heard",
      "Bad connection / noise",
      "Automated message / music",
      "Prank call",
      "Empty email",
    ]),
  },
  {
    id: "issue2InternalContact",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 6 }),
    options: Object.freeze([
      "FC response",
      "Training/test contact",
      "Other internal contact",
    ]),
  },
  {
    id: "issue2EmergencyCodes",
    level: 1,
    title: "Issue Code - 2",
    parent: Object.freeze({ branchId: "issue1", level: 0, optionIndex: 7 }),
    options: Object.freeze([
      "zCode 1",
      "zCode 2",
      "zCode 3",
      "Benchmark invoice printing",
    ]),
  },
  {
    id: "issue3QuestionsBeforeOrdering",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Product availability",
      "Questions about COVID-19 supply goods",
      "Product information",
      "Shipping methods, costs, or duration",
      "Payment",
      "Problems in the ordering process",
      "Return policies",
      "Inquiry about selling partner or marketplace",
      "Inquiry about customs policy or import fees",
      "Other questions before ordering",
      "Questions about digital products",
    ]),
  },
  {
    id: "issue4CovidSupplyGoods",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3QuestionsBeforeOrdering",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Website access to COVID-19 supply goods",
      "Other question about COVID-19 supply goods",
    ]),
  },
  {
    id: "issue4PreOrderPayment",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3QuestionsBeforeOrdering",
      level: 2,
      optionIndex: 4,
    }),
    options: Object.freeze([
      "Pre-order verification questions for credit card",
      "Other questions about payments",
      "General question about Barclays financing",
      "Technical problems with Barclays financing",
      "PayPal financing - more information",
      "Technical problems with PayPal financing",
      "PayPal financing - other",
    ]),
  },
  {
    id: "issue4DigitalProducts",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3QuestionsBeforeOrdering",
      level: 2,
      optionIndex: 10,
    }),
    options: Object.freeze([
      "Amazon Music",
      "Amazon Video",
      "AutoRip",
      "Amazon Apps",
      "Other digital products",
    ]),
  },
  {
    id: "issue3AccountInformation",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Update payment method",
      "Close customer account",
      "Email notifications",
      "Update delivery address",
      "Update billing address",
      "Update 1-Click settings",
      "Change email address or password",
      "Other changes in customer account",
    ]),
  },
  {
    id: "issue3PrimeMembership",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Prime membership cancellation requested",
      "Questions about Prime benefits",
      "Questions about Prime membership",
      "Questions about Amazon Family membership",
      "Questions about Amazon Student membership",
      "Questions about Amazon Azubi membership",
      "Questions about discounted Prime membership",
      "Pause membership",
      "Resume membership",
      "Prime Young Adult",
    ]),
  },
  {
    id: "issue4PrimeBenefits",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PrimeMembership",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Invite household members to Prime",
      "Switch to monthly/yearly membership",
      "Prime fee",
      "General questions about Prime",
    ]),
  },
  {
    id: "issue4AmazonStudentMembership",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PrimeMembership",
      level: 2,
      optionIndex: 4,
    }),
    options: membershipVerificationOptions,
  },
  {
    id: "issue4AmazonAzubiMembership",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PrimeMembership",
      level: 2,
      optionIndex: 5,
    }),
    options: membershipVerificationOptions,
  },
  {
    id: "issue4DiscountedPrimeMembership",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PrimeMembership",
      level: 2,
      optionIndex: 6,
    }),
    options: Object.freeze([
      "Questions about verification",
      "Other questions about membership",
    ]),
  },
  {
    id: "issue4PrimeYoungAdult",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PrimeMembership",
      level: 2,
      optionIndex: 9,
    }),
    options: Object.freeze([
      "General questions",
      "Activate membership",
      "Activation window expired",
      "Cancellation request",
      "Questions about free trial period",
      "Customer has already used the free trial period",
      "Inquiry about unknown charge",
    ]),
  },
  {
    id: "issue3NonOrderSellerFeedback",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Seller asked to place an order on another website",
      "Seller asked to pay outside Amazon",
      "Seller tried to influence rating, feedback, or review",
      "Seller sent unwanted emails or spam",
      "Seller harasses or intimidates the customer",
      "Seller offers prohibited items",
      "Other feedback about suspicious seller behavior",
    ]),
  },
  {
    id: "issue3NonOrderPromotions",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 4,
    }),
    options: Object.freeze([
      "Lightning deals",
      "Other promotions",
    ]),
  },
  {
    id: "issue4LightningDeals",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderPromotions",
      level: 2,
      optionIndex: 0,
    }),
    options: promotionTermsOptions,
  },
  {
    id: "issue4OtherNonOrderPromotions",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderPromotions",
      level: 2,
      optionIndex: 1,
    }),
    options: promotionTermsOptions,
  },
  {
    id: "issue3NonOrderGiftCardsTopup",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 6,
    }),
    options: Object.freeze([
      "Problems redeeming a gift card",
      "Amazon gift cards",
      "Top up Amazon account",
      "Question about identity information for gift cards",
    ]),
  },
  {
    id: "issue4GiftCardRedemptionProblems",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderGiftCardsTopup",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Redemption code does not work",
      "Redemption code difficult to identify/enter",
      "Problems with gift cards from physical retail stores dm, REWE, Edeka, etc.",
      "Gift card lost",
      "Redemption code already redeemed to another account",
      "RWQ redemption error only for physical gift cards",
    ]),
  },
  {
    id: "issue4AmazonGiftCards",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderGiftCardsTopup",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Selection and availability inquiry",
      "Question about gift card delivery",
      "Order gift card",
      "Use gift card balance",
    ]),
  },
  {
    id: "issue4NonOrderTopUpAmazonAccount",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderGiftCardsTopup",
      level: 2,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Balance inquiry",
      "Set up auto top-up",
      "Top up account",
      "Top up in store",
    ]),
  },
  {
    id: "issue4NonOrderGiftCardIdentityInfo",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3NonOrderGiftCardsTopup",
      level: 2,
      optionIndex: 3,
    }),
    options: giftCardIdentityOptions,
  },
  {
    id: "issue3NonOrderUnknownCharge",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 7,
    }),
    options: Object.freeze([
      "Payment not authorized",
      "Other unknown charge",
    ]),
  },
  {
    id: "issue3SubscribeSave",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 8,
    }),
    options: Object.freeze([
      "General information",
      "Manage subscription",
      "Discounts and intervals",
    ]),
  },
  {
    id: "issue3TradeIn",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 9,
    }),
    options: Object.freeze([
      "Status of a Trade-In exchange",
      "Trade-In gift card not received",
      "Expired Trade-In",
      "Other questions about Trade-In",
    ]),
  },
  {
    id: "issue3OtherNonOrderQuestions",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 10,
    }),
    options: Object.freeze([
      "Customer reports unauthorized access",
      "Website features",
      "Questions about recycling",
      "Feedback for Amazon",
      "Forgot email or password",
      "Problem with OTP / DCQ",
      "Problems with TIV",
      "Problem with Amazon Shopping App",
      "Questions about Amazon Visa card",
      "Questions about American Express Business credit card",
      "Suspicious email received / security concerns",
      "Customer account suspended",
      "Privacy - GDPR",
      "Data access request - DSAR",
      "Wish lists and lists",
      "Amazon Kids",
      "Amazon Vine",
      "Amazon Samples",
      "Amazon Security Awareness Training",
    ]),
  },
  {
    id: "issue4WebsiteFeatures",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherNonOrderQuestions",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Questions about using a website feature",
      "Feedback about a website feature",
      "Problem with a website feature",
    ]),
  },
  {
    id: "issue4NonOrderAmazonFeedback",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherNonOrderQuestions",
      level: 2,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Improvement suggestion",
      "Positive feedback",
      "Feedback about a selling partner or marketplace",
      "Feedback about Global Store",
      "Other feedback",
    ]),
  },
  {
    id: "issue4AmazonVisaCard",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherNonOrderQuestions",
      level: 2,
      optionIndex: 8,
    }),
    options: Object.freeze([
      "General questions about Visa card",
      "Questions about application / identification",
      "Welcome offer / credit",
      "Card not received",
      "Transfer to Zinia by Santander",
      "Shop with points",
      "Amazon Visa installment purchase",
      "Other",
    ]),
  },
  {
    id: "issue4AmexBusinessCard",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherNonOrderQuestions",
      level: 2,
      optionIndex: 9,
    }),
    options: Object.freeze([
      "General questions about American Express Business credit card",
      "Questions about application / identification",
      "Questions about activation",
      "Welcome offer / American Express gift card",
      "American Express extended payment term",
      "Transfer to American Express",
    ]),
  },
  {
    id: "issue4AmazonSamples",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherNonOrderQuestions",
      level: 2,
      optionIndex: 17,
    }),
    options: Object.freeze([
      "General questions",
      "Positive feedback",
      "Negative feedback",
      "Change delivery address",
      "Problems with the promotion",
    ]),
  },
  {
    id: "issue3AiGeneratedResponse",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2NotOrderRelated",
      level: 1,
      optionIndex: 11,
    }),
    options: Object.freeze([
      "Positive customer feedback",
      "Negative customer feedback",
      "Questions about Rufus privacy",
    ]),
  },
  {
    id: "issue4RufusNegativeFeedback",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3AiGeneratedResponse",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Problem with Rufus customer experience",
      "Problem with Rufus answer quality",
      "Problem with Rufus harmful response",
    ]),
  },
  {
    id: "issue3WhereIsMyOrder",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Not yet shipped",
      "In transit, on time",
      "In transit, delayed",
      "Shipment undeliverable",
      "Shipment is being returned to the seller",
      "Delivered according to scan, customer did not receive shipment",
      "Shipment is lost",
      "Order was cancelled",
      "Delivery date changed",
      "Incorrect delivery address",
      "Change Amazon Logistics delivery",
      "Problems with the carrier",
      "Amazon Pickup Points Locker / Counter",
      "Feedback/complaint about the carrier",
    ]),
  },
  {
    id: "issue3ProblemWithOrder",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Shipment delivered late",
      "Item defective / item does not work",
      "Packaging or item damaged",
      "Item is wrong or missing",
      "Item does not meet expectations",
      "Product recall",
      "No longer needed",
      "Duplicate or accidental order",
      "Customer reports unauthorized access",
      "Problem with customs clearance",
    ]),
  },
  {
    id: "issue3PaymentInquiry",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Payment method declined",
      "Incorrect price charged",
      "Deposit refund for car battery",
      "Price changed on the website",
      "Found a lower price elsewhere",
      "Monthly invoice",
      "Barclays financing",
      "PayPal financing",
      "Unknown charge",
      "Print invoice",
      "Question about VAT",
      "Shipping cost refund for consolidated delivery",
      "Prime - multiple shipping charges",
      "Returned direct debit",
      "Payment reminder",
      "Amazon Currency Converter",
      "Other payment problem",
      "Credit card rewards programs",
      "VAT refund",
    ]),
  },
  {
    id: "issue4PaymentMethodDeclined",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Monthly invoice declined or unavailable",
      "Direct debit declined or unavailable",
      "Card verification failed",
      "Card charge failed",
      "Voucher/promo declined or unavailable",
      "Payment via repayment link",
      "Other payment method was declined",
    ]),
  },
  {
    id: "issue4PriceChangedWebsite",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Price adjustment - price reductions after order placement",
      "Price preservation - price increase, replacement not possible",
    ]),
  },
  {
    id: "issue4MonthlyInvoice",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 5,
    }),
    options: Object.freeze([
      "General questions about monthly invoice",
      "Monthly invoice outdated or incorrect",
      "Questions about transfer details, invoice amount, or due date",
      "Wants to pay monthly invoice by credit card, voucher, or direct debit",
      "Problems with bank account authentication",
    ]),
  },
  {
    id: "issue4BarclaysFinancing",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 6,
    }),
    options: Object.freeze([
      "Questions about activated financing",
      "Refund or cancellation",
      "Technical problems",
      "Application was declined by BAWAG",
      "Loan was approved, but the order is not confirmed",
      "Other financing problems",
    ]),
  },
  {
    id: "issue4PaypalFinancing",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 7,
    }),
    options: Object.freeze([
      "Questions about activated financing",
      "Technical problems",
      "Application was declined by PayPal",
      "Refund or cancellation",
      "Loan was approved, but the order is not confirmed",
      "Other financing problems",
    ]),
  },
  {
    id: "issue4UnknownCharge",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 8,
    }),
    options: Object.freeze([
      "Charge for cancelled order",
      "Charge for unavailable item",
      "Charge due to change after order placement",
      "Inquiry about credit card authorization charge",
      "Other unknown charge",
    ]),
  },
  {
    id: "issue4VatQuestion",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 10,
    }),
    options: Object.freeze([
      "General questions about VAT",
      "VAT changed after the order",
    ]),
  },
  {
    id: "issue4CreditCardRewards",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 17,
    }),
    options: Object.freeze([
      "American Express Membership Rewards points",
      "Amazon Business American Express Card Rewards points",
      "Amazon.de Visa card points",
    ]),
  },
  {
    id: "issue4VatRefund",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3PaymentInquiry",
      level: 2,
      optionIndex: 18,
    }),
    options: Object.freeze([
      "VAT refund NATO",
      "VAT refund embassy",
      "VAT refund B2B",
      "VAT refund export",
      "VAT refund exceptional regions",
      "VAT refund declined",
      "VAT refund abroad",
      "VAT refund domestic",
      "VAT refund incorrectly calculated",
      "VAT refund photovoltaic",
      "VAT refund other",
    ]),
  },
  {
    id: "issue3MarketplaceSellingPartner",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Feedback about a seller",
      "Suspected abuse",
      "A-to-z Guarantee claim",
    ]),
  },
  {
    id: "issue4SellerFeedback",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3MarketplaceSellingPartner",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Complaint about seller communication",
      "Question about seller ratings",
      "Feedback about Global Store",
    ]),
  },
  {
    id: "issue4SuspectedAbuse",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3MarketplaceSellingPartner",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Contact outside Amazon",
      "Payment transfer outside Amazon",
      "Review manipulation",
      "Other suspected abuse",
    ]),
  },
  {
    id: "issue4AtozClaim",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3MarketplaceSellingPartner",
      level: 2,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "File A-to-z Guarantee claim",
      "Check claim status",
      "Cancel A-to-z Guarantee claim",
      "Other question about A-to-z Guarantee claim",
    ]),
  },
  {
    id: "issue3ChangeOrder",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 4,
    }),
    options: Object.freeze([
      "Cancel an item or order",
      "Change delivery address",
      "Change shipping method",
      "Add items or combine orders",
      "Change payment method or billing address",
      "Other change to the order",
    ]),
  },
  {
    id: "issue4CancelItemOrder",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ChangeOrder",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Item would arrive too late",
      "Wrong item ordered",
      "Cancellation for another reason",
    ]),
  },
  {
    id: "issue3Promotions",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 5,
    }),
    options: Object.freeze([
      "Promotion not applied to order",
      "Video game pre-order codes",
      "Other questions about promotions",
    ]),
  },
  {
    id: "issue4VideoGamePreorderCodes",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3Promotions",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Code not received",
      "Code does not work",
    ]),
  },
  {
    id: "issue3Recycling",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 6,
    }),
    options: Object.freeze([
      "Return label requested",
      "Request pickup",
      "Information about recycling collection point",
      "Other question about recycling",
    ]),
  },
  {
    id: "issue4RecyclingPickup",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3Recycling",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Recycling at time of delivery / old appliance disposal",
      "Subsequent old appliance disposal requested",
    ]),
  },
  {
    id: "issue3ReturnsRefunds",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 7,
    }),
    options: Object.freeze([
      "How to return an item?",
      "Return label requested or cancelled",
      "Check return/refund status",
      "Pickup failed",
    ]),
  },
  {
    id: "issue4ReturnRefundStatus",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ReturnsRefunds",
      level: 2,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Return is not delayed",
      "Return is delayed on the way to Amazon",
      "Processing delay by FC / seller",
      "Refund is not delayed",
      "Pending credit",
      "Refund is delayed by financial institution",
      "Refund error",
      "Refund of return shipping costs",
    ]),
  },
  {
    id: "issue4PickupFailed",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ReturnsRefunds",
      level: 2,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "No pickup attempt by carrier",
      "Carrier did not accept the item",
      "Pickup incorrectly arranged by CS",
      "Customer requests appointment change for pickup order - no carrier error",
      "Customer was not found",
      "Cancel pickup order",
    ]),
  },
  {
    id: "issue3RepairService",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 8,
    }),
    options: Object.freeze([
      "Pre-repair inquiry",
      "Check repair status",
      "Customer rejects repair",
      "Post-repair inquiry",
    ]),
  },
  {
    id: "issue4PostRepairInquiry",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3RepairService",
      level: 2,
      optionIndex: 3,
    }),
    options: Object.freeze([
      "Transfer to specialist team",
      "Item still defective - same defect",
      "New defect - second repair",
      "Inquiry from repair service",
      "Customer-caused damage / cost estimate",
      "Item damaged or lost",
    ]),
  },
  {
    id: "issue3GiftCardsTopup",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 9,
    }),
    options: Object.freeze([
      "Top up Amazon account",
      "Gift cards & top-up promotion",
      "Question about identity information for gift cards",
    ]),
  },
  {
    id: "issue4TopUpAmazonAccount",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3GiftCardsTopup",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Balance inquiry",
      "Use balance",
      "Top up in store",
      "Direct debit",
    ]),
  },
  {
    id: "issue4GiftCardsTopupPromotion",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3GiftCardsTopup",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Customer did not receive expected reward",
      "Customer could not see their reward",
      "Question about promotion terms and conditions",
      "Question about using promotional reward",
    ]),
  },
  {
    id: "issue4GiftCardIdentityInfo",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3GiftCardsTopup",
      level: 2,
      optionIndex: 2,
    }),
    options: giftCardIdentityOptions,
  },
  {
    id: "issue3LargeApplianceService",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 10,
    }),
    options: Object.freeze([
      "Customer error",
      "Amazon / carrier error",
    ]),
  },
  {
    id: "issue3OtherOrderQuestion",
    level: 2,
    title: "Issue Code - 3",
    parent: Object.freeze({
      branchId: "issue2OrderRelated",
      level: 1,
      optionIndex: 11,
    }),
    options: Object.freeze([
      "Follow-up question about order details",
      "Question about gift wrapping",
      "Feedback to Amazon",
      "Digital Markets Act (DMA)",
    ]),
  },
  {
    id: "issue4OrderDetailsFollowUp",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherOrderQuestion",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Question about shipping methods or duration",
      "Customer wants order confirmation",
      "Prime delivery promise more than one business day after shipment",
    ]),
  },
  {
    id: "issue4AmazonFeedback",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3OtherOrderQuestion",
      level: 2,
      optionIndex: 2,
    }),
    options: Object.freeze([
      "Improvement suggestion",
      "Positive feedback",
      "Packaging feedback",
      "Other feedback",
    ]),
  },
  {
    id: "issue4DefectiveItem",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ProblemWithOrder",
      level: 2,
      optionIndex: 1,
    }),
    options: Object.freeze([
      "Does not work / defective",
      "Problem with expiration date",
    ]),
  },
  {
    id: "issue4PackagingOrItemDamaged",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ProblemWithOrder",
      level: 2,
      optionIndex: 2,
    }),
    options: packagingDamageOptions,
  },
  {
    id: "issue4WrongOrMissingItem",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ProblemWithOrder",
      level: 2,
      optionIndex: 3,
    }),
    options: wrongOrMissingItemOptions,
  },
  {
    id: "issue4ItemExpectations",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ProblemWithOrder",
      level: 2,
      optionIndex: 4,
    }),
    options: itemExpectationsOptions,
  },
  {
    id: "issue4CustomsClearance",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3ProblemWithOrder",
      level: 2,
      optionIndex: 9,
    }),
    options: Object.freeze([
      "Problem with customs fees/import duties",
      "Problem with commercial invoice/accompanying documents",
      "Held by customs - further processing required",
      "Rejected by customs - being returned to seller",
      "Customs delays",
    ]),
  },
  {
    id: "issue4NotYetShipped",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 0,
    }),
    options: Object.freeze([
      "Item in stock but not yet shipped",
      "Item not in stock",
      "Item not yet released / pre-order",
      "Prime delivery promise more than one business day after shipment",
    ]),
  },
  {
    id: "issue4InTransitOnTime",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 1,
    }),
    options: primeDeliveryPromiseOptions,
  },
  {
    id: "issue4InTransitDelayed",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 2,
    }),
    options: primeDeliveryPromiseOptions,
  },
  {
    id: "issue4DeliveredNotReceived",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 5,
    }),
    options: Object.freeze([
      "Carrier investigation initiated",
      "Carrier investigation not possible",
    ]),
  },
  {
    id: "issue4OrderCancelled",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 7,
    }),
    options: Object.freeze([
      "Cancellation by Amazon",
      "Cancellation by seller",
    ]),
  },
  {
    id: "issue4ChangeAmazonLogisticsDelivery",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 10,
    }),
    options: Object.freeze([
      "Amazon Logistics customer requests redelivery",
      "Amazon Logistics customer requests reroute",
      "Amazon Logistics customer shares delivery preference",
    ]),
  },
  {
    id: "issue4CarrierProblems",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 11,
    }),
    options: Object.freeze([
      "Delivery to safe place without safe-place agreement",
      "Delivery to safe place/neighbor despite customer being present",
      "Unauthorized access to customer's property",
      "Safe-place instruction not followed",
      "Rude or unprofessional behavior",
      "Driver does not wait long enough during delivery",
      "Customer disputes delivery attempt",
      "Customer disputes accuracy of signature/delivery scan",
      "Complaint about driving behavior",
      "Delivery outside delivery hours",
      "Package delivered carelessly",
      "Customer property damaged",
    ]),
  },
  {
    id: "issue4PickupPoints",
    level: 3,
    title: "Issue Code - 4",
    parent: Object.freeze({
      branchId: "issue3WhereIsMyOrder",
      level: 2,
      optionIndex: 12,
    }),
    options: Object.freeze([
      "Pickup code not received",
      "Pickup code does not work",
      "Pickup button in Amazon app / Amazon app does not work",
      "Locker screen/scanner does not work",
      "Locker compartment does not open",
      "Locker compartment is empty",
      "Customer received someone else's package",
      "Smartphone does not connect properly to the Locker",
      "Opening hours are incorrect",
      "Pickup Point is closed/not accessible",
      "Wrong pickup location customer mixed up Locker/Counter",
      "Pickup Point pickup station not found",
      "Customer will not pick up the package",
      "Delivery date changed after order",
    ]),
  },
]);

const selectedOptions = Array(
  Math.max(...issueBranches.map((branch) => branch.level)) + 1,
).fill(null);
const branchById = new Map(issueBranches.map((branch) => [branch.id, branch]));
const renderedBranchIds = new Set();
const branchTree = getRequiredElement("#sicBranchTree");
const selectedCode = getRequiredElement("#selectedCode");
const selectedLabel = getRequiredElement("#selectedLabel");
const themeToggle = getRequiredElement("#themeToggle");
const themeController = createThemeController(themeToggle);
const clearSicSelection = getRequiredElement("#clearSicSelection");

function getRequiredElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function createElement(
  tagName,
  {
    className = "",
    textContent = "",
    dataset = {},
    attributes = {},
    styleProperties = {},
  } = {},
) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent) {
    element.textContent = textContent;
  }

  Object.entries(dataset).forEach(([key, value]) => {
    element.dataset[key] = value;
  });

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  Object.entries(styleProperties).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });

  return element;
}

function isBranchVisible(branch) {
  if (!branch.parent) {
    return true;
  }

  const selectedParent = selectedOptions[branch.parent.level];

  return (
    selectedParent?.branchId === branch.parent.branchId &&
    selectedParent.optionIndex === branch.parent.optionIndex
  );
}

function getVisibleBranches() {
  return issueBranches.filter(isBranchVisible);
}

function getSelectedOption(branch) {
  const selectedOption = selectedOptions[branch.level];

  if (selectedOption?.branchId !== branch.id) {
    return null;
  }

  return selectedOption;
}

function getDelayMs(index, stepMs, maxDelayMs = Infinity) {
  return `${Math.min(index * stepMs, maxDelayMs)}ms`;
}

function getIssueCode(level, optionIndex) {
  return [...selectedOptions.slice(0, level), { optionIndex }]
    .filter(Boolean)
    .map((selection) => selection.optionIndex + 1)
    .join(".");
}

function clearChildSelections(level) {
  selectedOptions.fill(null, level + 1);
}

function clearSelections() {
  selectedOptions.fill(null);
}

function selectBranchOption(branch, optionIndex) {
  selectedOptions[branch.level] = {
    branchId: branch.id,
    optionIndex,
  };
  clearChildSelections(branch.level);
}

function updateSelectedOutput(branch, optionIndex) {
  selectedCode.textContent = getIssueCode(branch.level, optionIndex);
  selectedLabel.textContent = branch.options[optionIndex];
}

function resetSelectedOutput() {
  selectedCode.textContent = initialOutput.code;
  selectedLabel.textContent = initialOutput.label;
}

function createIssueButton(branch, optionIndex, label) {
  const selectedOption = getSelectedOption(branch);
  const isActive = selectedOption?.optionIndex === optionIndex;
  const button = createElement("button", {
    className: `sic-option workspace-control-btn ${
      isActive ? "btn-active" : ""
    }`.trim(),
    textContent: label,
    dataset: {
      branchId: branch.id,
      optionIndex: String(optionIndex),
    },
    attributes: {
      type: "button",
      "aria-pressed": String(isActive),
    },
    styleProperties: {
      "--sic-option-delay": getDelayMs(
        optionIndex + 1,
        animationTiming.optionStepMs,
        animationTiming.maxOptionDelayMs,
      ),
    },
  });

  return button;
}

function createBranch(branch, branchIndex, shouldAnimate = false) {
  const section = createElement("section", {
    className: `modal sic-branch ${
      shouldAnimate ? "sic-branch-enter" : ""
    }`.trim(),
    styleProperties: {
      "--sic-branch-delay": getDelayMs(
        branchIndex + 1,
        animationTiming.branchStepMs,
      ),
    },
  });
  const heading = createElement("h2", {
    className: "sic-branch-title",
    textContent: branch.title,
  });
  const options = createElement("div", {
    className: "sic-options",
  });

  branch.options.forEach((option, optionIndex) => {
    options.appendChild(createIssueButton(branch, optionIndex, option));
  });

  section.append(heading, options);

  return section;
}

function renderBranchTree() {
  const visibleBranches = getVisibleBranches();

  branchTree.replaceChildren(
    ...visibleBranches.map((branch, branchIndex) =>
      createBranch(branch, branchIndex, !renderedBranchIds.has(branch.id)),
    ),
  );
  renderedBranchIds.clear();
  visibleBranches.forEach((branch) => renderedBranchIds.add(branch.id));
}

function handleIssueSelection(event) {
  const button = event.target.closest("[data-branch-id][data-option-index]");

  if (!button) {
    return;
  }

  const branch = branchById.get(button.dataset.branchId);
  const optionIndex = Number(button.dataset.optionIndex);

  if (!branch) {
    return;
  }

  selectBranchOption(branch, optionIndex);
  updateSelectedOutput(branch, optionIndex);
  renderBranchTree();
}

function resetSicSelection() {
  clearSelections();
  renderedBranchIds.clear();
  resetSelectedOutput();
  renderBranchTree();
}

function initializeTheme() {
  themeController.initialize();
}

function handleThemeToggle() {
  themeController.set(themeToggle.checked);
}

branchTree.addEventListener("click", handleIssueSelection);
themeToggle.addEventListener("change", handleThemeToggle);
clearSicSelection.addEventListener("click", resetSicSelection);

initializeTheme();
resetSelectedOutput();
renderBranchTree();
