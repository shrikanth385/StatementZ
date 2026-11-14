# StatementZ — Refactored

This version keeps the existing StatementZ browser application and its current feature set while reorganizing the source into clearer responsibility-based folders.

## Structure

- `index.html` — application shell and static sidebar/header markup
- `statements.json` — statement catalogue; keys/placeholders are preserved
- `css/style.css` — application styling and design tokens
- `js/app.js` — application entry point and event orchestration
- `js/core/` — state and shared DOM utilities
- `js/shell/` — theme, application shell, marketplace configuration
- `js/workspace/` — workspace rendering, controls, tool configuration, shared form-template configuration and output builders
- `js/components/` — reusable dropdown, calendar and notepad components
- `js/services/` — clock/location and Bellboy services
- `sicCodes/` — standalone DE SIC Codes application

## Calendar

The StatementZ calendar retains its existing date input, local ISO date handling, month/year selection, navigation and input-event behavior. Its visual treatment has been aligned with the MetricMate calendar language: compact rounded controls, consistent surfaces, focus states, selected-date treatment, today indicator, responsive sizing and matching dropdown layering.

## Refactor constraints

- Existing statement keys and placeholder names are preserved.
- Existing tool names and data attributes are preserved.
- Form-template field metadata is shared through `js/workspace/formTemplateConfig.js`, keeping UI control definitions separate from output-builder dependencies.
- Existing local-storage keys are preserved.
- No framework or build step was introduced.
- The application remains a browser-native ES-module application.

## Validation performed

- All JavaScript files pass `node --check`.
- `statements.json` parses successfully.
- Local JavaScript import paths were checked against the filesystem.
- Local HTML asset references were checked against the filesystem.
- CSS was parsed with `tinycss2` without syntax errors.
- Duplicate top-level JavaScript function declarations were checked.


## Architecture and layout maintenance

- `js/components/clockCardCarousel.js` owns carousel DOM construction, slide state, navigation accessibility, rotation timers, and pause/resume behavior. `js/app.js` only connects the component to clock and alarm state.
- The right-bottom sidebar uses a grid with a reserved, fixed-height search row and a fixed-height card row. Hiding the location search leaves the row reserved, so the card and its navigation stay at the same vertical position.
- Carousel navigation is absolutely anchored to the carousel viewport, outside the moving track. Slide content reserves a consistent navigation dock, and slide width/track translation are based on the same two-slide geometry.
- Header and right-bottom base layout rules are consolidated to reduce conflicting duplicate selectors. Desktop header layout uses a single row; the existing responsive breakpoint-specific layout is retained.
- Shared dimensions and transition timing remain CSS design tokens. Existing statement data, workspace tool definitions, local-storage keys, and mini-app entry points are preserved.

## Startup performance and refactor notes

The statement catalogue (`statements.json`) is required before the first workspace can be rendered. The HTML head preloads it during document/module loading, and `js/app.js` starts or joins the same catalogue load while the agent enters their name, rather than waiting until **Launch Workspace** is clicked. Initialization awaits the same in-flight request, so the request is not duplicated. If the request fails, the launch screen remains visible and shows a recoverable error instead of hiding the screen and leaving an empty workspace.

The catalogue loader now checks HTTP status and the top-level JSON shape, permits retry after a failed request, and safely interpolates non-string dynamic values. These changes are deliberately narrow and preserve the existing public API and statement data shape.

For the full architecture, startup sequence, module/function catalogue, static validation results, limitations, and line-numbered source reference, see `docs/StatementZ-Developer-Guide.pdf` (generated alongside the refactored project archive) and `docs/Refactor-Audit.md`.
