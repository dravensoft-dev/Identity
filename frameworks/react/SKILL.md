<!-- GENERATED from the contracts by bun run generate:skills. Edit the contracts, not this file. -->

# Arena components, the React layer

Every component this layer ships, by category, under the names it binds them to. **This page is
an index, not a manual.** How to write one is its own prompt, linked in the last column.

Import from the package root, never from a path inside it:

```tsx
import { Button, Tag } from '@dravensoft/arena-react';
```

A member is a prop. The main slot is `children`, a named slot is a prop taking a node, and an
event is an `on`-prefixed handler. An icon is a Phosphor class-name string, never an element.

- Installing the package, declaring your skin, and what it exports besides components:
  [`PACKAGE.md`](./PACKAGE.md).
- Every component Arena ships, including any this layer does not:
  [`../SKILL.md`](../SKILL.md).
- **Takes** is the members the component's API contract declares, in contract order, under this
  layer's own names. A member marked `*` is required; the prompt gives its type and its default.

## brand

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `AppLogo` | Brand lock-up: a mark beside or above a product name. | `mark*` `name*` `dim` `size` `orientation` | [`AppLogo.prompt.md`](./components/brand/app-logo/AppLogo.prompt.md) |

## charts

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `BarChart` | Categorical bars on one axis. Dependency-free SVG that reads the token layer directly, with a visually-hidden table of the same numbers. | `labels*` `values*` `seriesLabel*` `slot` `slots` `tone` `valueSuffix` `valuePrefix` `valueFormat` `height` `minPointSpacing` | [`BarChart.prompt.md`](./components/charts/bar-chart/BarChart.prompt.md) |
| `ChartCard` | A titled card frame around a chart, with an optional actions slot in its head. | `title` `actions` `children` | [`ChartCard.prompt.md`](./components/charts/chart-card/ChartCard.prompt.md) |
| `DoughnutChart` | Parts of one whole, as a ring with a legend beside it. Identity only: a slice is a category by definition, so there is no tone. Dependency-free SVG with a visually-hidden table of the same numbers. | `labels*` `values*` `seriesLabel*` `slots` `valueSuffix` `valuePrefix` `legendLayout` `onSliceActivate` `valueFormat` | [`DoughnutChart.prompt.md`](./components/charts/doughnut-chart/DoughnutChart.prompt.md) |
| `LineChart` | One series over an ordered sequence, on one axis. Dependency-free SVG with a crosshair that snaps to the nearest point, and a visually-hidden table of the same numbers. | `labels*` `values*` `seriesLabel*` `slot` `tone` `area` `valueSuffix` `valuePrefix` `valueFormat` `height` `minPointSpacing` | [`LineChart.prompt.md`](./components/charts/line-chart/LineChart.prompt.md) |

## display

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `ActivityFeed` | An event feed: someone did something to something, then. Arena draws every row. | `label*` `items*` `busy` | [`ActivityFeed.prompt.md`](./components/display/activity-feed/ActivityFeed.prompt.md) |
| `Avatar` | A person or entity mark: the image when `src` is set, initials from `name` otherwise, with an optional presence dot. | `src` `name` `size` `shape` `status` | [`Avatar.prompt.md`](./components/display/avatar/Avatar.prompt.md) |
| `Badge` | Status label: mono, uppercase, short. Carries an object's actual state or an editorial emphasis, never decoration. | `children` `tone` `dot` | [`Badge.prompt.md`](./components/display/badge/Badge.prompt.md) |
| `Calendar` | Week or day schedule on a time grid. Colour is identity, never state. | `children` `timeZone` `anchorDate` `view` `dayStart` `dayEnd` `weekStartsOn` `hideEmptyWeekend` `dayInteractive` `onDateClick` `onRangeChange` `actions` | [`Calendar.prompt.md`](./components/display/calendar/Calendar.prompt.md) |
| `CalendarEvent` | One event on a Calendar's schedule. Times are ISO datetimes read in the calendar's timeZone, never the reader's. Calendar draws the chip; the consumer writes one of these per event and Calendar settles where it goes. | `id*` `title*` `start*` `end*` `colorId` `interactive` `actionsEnabled` `actions` `disabled` `onClick` | [`CalendarEvent.prompt.md`](./components/display/calendar-event/CalendarEvent.prompt.md) |
| `Card` | Surface container. Hairline border on the base surface scale; depth comes from the shadow, never a gradient. | `children` `interactive` `disabled` `href` `action` `title` `eyebrow` `floating` `accent` `onClick` | [`Card.prompt.md`](./components/display/card/Card.prompt.md) |
| `Skeleton` | A loading placeholder that reserves the space real content will take. | `variant` `width` `height` `lines` `radius` | [`Skeleton.prompt.md`](./components/display/skeleton/Skeleton.prompt.md) |
| `StatCard` | One metric on a card surface: a micro-label, the number, an optional delta pill and a sub-line. | `label*` `value*` `tone` `delta` `sub` `icon` | [`StatCard.prompt.md`](./components/display/stat-card/StatCard.prompt.md) |
| `Table` | Data table on the density tokens. Table draws the header row from `columns`, owns the grid and its keyboard, and decides where each row sits; the consumer writes one TableRow per row and one TableCell per cell, so a cell's content is a value or one of Arena's own components rather than something returned from a per-item render function. Below --bp-md it becomes one card per row, measured on its own container rather than the viewport. | `label*` `columns*` `children` `empty` `sort` `onSortChange` `page` `onPageChange` `sortControl` `responsive` | [`Table.prompt.md`](./components/display/table/Table.prompt.md) |
| `TableCell` | One cell of a TableRow. It draws the cell box (the padding, the alignment and the mono/gold treatment its column asks for, and in card mode the label/value pair or the full-width block), and shows whatever the consumer put in it. Its column config, its layout and its place in the grid's keyboard order come from Table and TableRow and are members of no contract. | `children` | [`TableCell.prompt.md`](./components/display/table-cell/TableCell.prompt.md) |
| `TableRow` | One row of a Table. The consumer writes one per row and one TableCell inside it per cell. Where the row sits, the columns its cells are set against and how the keyboard reaches them are Table's, not this component's, and are members of no contract: the same shape, and for the same reason, as a RadioGroup and its Radios sharing which one is checked. | `children` `interactive` `disabled` `onClick` | [`TableRow.prompt.md`](./components/display/table-row/TableRow.prompt.md) |
| `Tag` | A pill for filters, technologies and statuses. Optional tone, optional dismiss. | `children` `tone` `removable` `disabled` `onRemove` | [`Tag.prompt.md`](./components/display/tag/Tag.prompt.md) |
| `UnauthCard` | The panel a signed-out screen needs: sign in, check your inbox, this link expired, a two-factor code. It knows nothing about credentials on purpose; the fields are composed inside it. | `brand` `eyebrow` `title` `children` `footer` | [`UnauthCard.prompt.md`](./components/display/unauth-card/UnauthCard.prompt.md) |

## feedback

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `Alert` | A tone-coloured message with an optional icon, a single action, and optional dismissal. | `tone` `title` `children` `icon` `actionLabel` `onAction` `dismissible` `onClose` | [`Alert.prompt.md`](./components/feedback/alert/Alert.prompt.md) |
| `ConfirmDialog` | Confirmation of a high-consequence action. Never closes on click-outside. `requireText` locks the confirm button until a word is typed. | `open*` `title*` `eyebrow` `children` `confirmLabel` `cancelLabel` `destructive` `requireText` `onCancel` `onConfirm` | [`ConfirmDialog.prompt.md`](./components/feedback/confirm-dialog/ConfirmDialog.prompt.md) |
| `Dialog` | Modal dialog over a blurred scrim. Takes the whole interaction until dismissed. | `open*` `title*` `eyebrow` `width` `children` `footer` `onClose` | [`Dialog.prompt.md`](./components/feedback/dialog/Dialog.prompt.md) |
| `EmptyState` | A placeholder for an empty collection: an icon, a title, a message, and an optional action. | `icon` `title*` `message` `action` | [`EmptyState.prompt.md`](./components/feedback/empty-state/EmptyState.prompt.md) |
| `ErrorState` | Section/screen-level failure, with recovery and an optional diagnostic code. | `icon` `title` `message` `code` `retryLabel` `onRetry` `secondaryAction` | [`ErrorState.prompt.md`](./components/feedback/error-state/ErrorState.prompt.md) |
| `Onboarding` | Guided coachmark tour (H10): presents features within the product with progress dots, Skip and Next. Controlled: the host owns index and answers the four events. | `open*` `steps*` `index` `anchor` `onNext` `onBack` `onSkip` `onDone` | [`Onboarding.prompt.md`](./components/feedback/onboarding/Onboarding.prompt.md) |
| `ProgressBar` | Determinate progress by default; indeterminate for a wait with no percentage. | `progressPercentage` `indeterminate` `tone` `label*` `showPercentage` `size` | [`ProgressBar.prompt.md`](./components/feedback/progress-bar/ProgressBar.prompt.md) |
| `Sheet` | A non-modal panel anchored to one edge of the page: a cart, a filter drawer, a detail pane. It carries no scrim, traps no focus and takes nothing away from the page behind it, which is the whole difference from a dialog. Its header stays on screen while its body folds away, so a reader keeps the panel without keeping its bulk. | `open*` `placement` `title*` `collapsed` `onCollapsedChange` `dismissible` `onClose` `children` `footer` | [`Sheet.prompt.md`](./components/feedback/sheet/Sheet.prompt.md) |
| `Spinner` | Indeterminate wait indicator. For a measurable process use ProgressBar instead. | `size` `tone` `label` | [`Spinner.prompt.md`](./components/feedback/spinner/Spinner.prompt.md) |
| `Toast` | Ephemeral notification with a tone-coloured side bar and one optional action. | `title` `message` `tone` `actionLabel` `onAction` `persist` `dismissible` `onClose` | [`Toast.prompt.md`](./components/feedback/toast/Toast.prompt.md) |
| `ToastHost` | The fixed box a stack of notices renders into. It decides where the stack sits, how far it stands off the viewport edges and how much air separates two notices, and it decides nothing else: it reads no notice, counts none, and owns no clock. | `placement` `children` | [`ToastHost.prompt.md`](./components/feedback/toast-host/ToastHost.prompt.md) |
| `Tooltip` | A short label revealed on pointer intent. Bone over dark for contrast. It waits before appearing and before withdrawing, so a pointer crossing a toolbar reveals nothing. | `label*` `children*` | [`Tooltip.prompt.md`](./components/feedback/tooltip/Tooltip.prompt.md) |

## forms

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `Button` | Action button. One primary per view; danger stays outline. | `children` `variant` `size` `icon` `iconRight` `loading` `full` `disabled` `type` `name` `value` `autoFocus` `form` `tabStop` `onClick` | [`Button.prompt.md`](./components/forms/button/Button.prompt.md) |
| `Checkbox` | A single checkbox. Checked shows a crimson fill with a check. | `checked` `label` `disabled` `required` `name` `value` `onChange` | [`Checkbox.prompt.md`](./components/forms/checkbox/Checkbox.prompt.md) |
| `IconButton` | Icon-only button. Carries an accessible name in every state, not only on hover. | `icon*` `label*` `size` `variant` `showLabel` `pressed` `disabled` `type` `name` `value` `autoFocus` `form` `tabStop` `onClick` | [`IconButton.prompt.md`](./components/forms/icon-button/IconButton.prompt.md) |
| `Input` | Text field with validation. Focus is a gold ring; error crimson; valid green with a check. The four states are ordered and the order is normative: error, then focus, then valid, then neutral: an errored field stays crimson while it has focus, because the validation signal must not disappear at the moment the user acts on it. | `label` `id` `hint` `error` `valid` `required` `validate` `validateOn` `type` `icon` `prefix` `value` `disabled` `readOnly` `placeholder` `name` `autoComplete` `min` `max` `step` `maxLength` `pattern` `onChange` `onBlur` | [`Input.prompt.md`](./components/forms/input/Input.prompt.md) |
| `Radio` | One option inside a RadioGroup. Selected shows a crimson dot inside the ring. | `value*` `label` `hint` `disabled` | [`Radio.prompt.md`](./components/forms/radio/Radio.prompt.md) |
| `RadioGroup` | Single-selection group. Governs the value and distributes it to its child Radios. | `ariaLabel*` `children` `value` `name` `onChange` | [`RadioGroup.prompt.md`](./components/forms/radio-group/RadioGroup.prompt.md) |
| `Select` | Styled native dropdown selector, with the same validation vocabulary Input carries. The four states are ordered and the order is the same normative one: error, then focus, then valid, then neutral -- an errored control stays crimson while it has focus, because the validation signal must not disappear at the moment the user acts on it. A form that mixes Input and Select is a form whose fields must report a failure the same way, or it gets validated by hand or not at all. | `label` `placeholder` `options` `value` `disabled` `required` `hint` `error` `valid` `icon` `name` `onChange` | [`Select.prompt.md`](./components/forms/select/Select.prompt.md) |
| `Switch` | A controlled on/off switch showing an icon per state. `confirm` gates a high-impact change through a ConfirmDialog before it applies. | `state` `orientation` `size` `iconOn` `iconOff` `label*` `disabled` `confirm` `onFuncOn` `onFuncOff` `onRequestChange` | [`Switch.prompt.md`](./components/forms/switch/Switch.prompt.md) |
| `Textarea` | Multi-line text field with validation and an optional counter. | `label` `id` `hint` `error` `required` `counter` `autoResize` `value` `disabled` `readOnly` `placeholder` `name` `maxLength` `rows` `onChange` | [`Textarea.prompt.md`](./components/forms/textarea/Textarea.prompt.md) |

## layout

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `Grid` | A grid that decides its own column count from the room it is given, rather than from a breakpoint anyone had to pick. Cells are as wide as they can be at or above a minimum, and the count falls as the room does, all the way to one. | `min` `gap` `maxWidth` `children` | [`Grid.prompt.md`](./components/layout/grid/Grid.prompt.md) |

## navigation

| Component | What it is | Takes | Usage |
|---|---|---|---|
| `BottomNav` | The bar of destinations pinned to the bottom edge of a phone screen. A compound component: the consumer writes one BottomNavItem per destination, and the coordination that tells each child which id is active and how to report `nav` is the parent's. That coordination is a member of no contract and each layer wires it in its own idiom. It is a row of equal columns with the glyph above the label, which is what separates it from a sidebar's stack of indented rows. | `active` `ariaLabel*` `children` `onNav` | [`BottomNav.prompt.md`](./components/navigation/bottom-nav/BottomNav.prompt.md) |
| `BottomNavItem` | One destination in a BottomNav. The consumer writes one per destination; which id is currently active and how it reports `nav` are settled between it and its parent, and none of that is a member of this contract, the same shape and the same reason as SideNavItem and as the name a RadioGroup settles with each Radio. It draws its glyph above its label and takes an equal share of the bar's width, however many destinations there are. | `id*` `label*` `icon*` `badge` `href` `disabled` | [`BottomNavItem.prompt.md`](./components/navigation/bottom-nav-item/BottomNavItem.prompt.md) |
| `Breadcrumbs` | A trail of ancestor locations ending at the current one. An explicit return path for hierarchies deeper than tabs. | `ariaLabel*` `items*` `separator` `onNavigate` | [`Breadcrumbs.prompt.md`](./components/navigation/breadcrumbs/Breadcrumbs.prompt.md) |
| `BulkActionBar` | Appears when rows are selected and operates on the selection as a set. Renders nothing at a count of zero. | `count*` `noun` `actions*` `onRun` `layout` `clearable` `onClear` | [`BulkActionBar.prompt.md`](./components/navigation/bulk-action-bar/BulkActionBar.prompt.md) |
| `CommandPalette` | Power-user accelerator (Cmd/Ctrl+K): search and run actions without a mouse. Controlled: the host owns whether it is open. | `open*` `commands*` `placeholder` `maxResults` `onClose` `onRun` | [`CommandPalette.prompt.md`](./components/navigation/command-palette/CommandPalette.prompt.md) |
| `Menu` | Dropdown menu of actions on a trigger -- overflow, more actions, context. | `trigger*` `items*` `align` `onSelect` | [`Menu.prompt.md`](./components/navigation/menu/Menu.prompt.md) |
| `PageHead` | A page heading: a required title, an optional subtitle, and an optional actions slot. | `title*` `subtitle` `actions` `align` | [`PageHead.prompt.md`](./components/navigation/page-head/PageHead.prompt.md) |
| `Pagination` | Page selector for a paged list. Renders a windowed range, never every page. | `page*` `pageCount*` `ariaLabel*` `onChange` | [`Pagination.prompt.md`](./components/navigation/pagination/Pagination.prompt.md) |
| `SegmentedControl` | A compact inline filter over mutually exclusive options. A real radio group, never a tab list, and it carries no crimson. | `options*` `value` `defaultValue` `size` `ariaLabel*` `name` `onChange` | [`SegmentedControl.prompt.md`](./components/navigation/segmented-control/SegmentedControl.prompt.md) |
| `SideNav` | The sidebar's navigation list -- the list alone, not the frame around it. A compound component: the consumer writes one SideNavItem per destination, and the coordination that tells each child where it sits, which id is active and how to report `nav` is the parent's. That coordination is a member of no contract and each layer wires it in its own idiom. | `active` `ariaLabel*` `children` `indentStep` `onNav` | [`SideNav.prompt.md`](./components/navigation/side-nav/SideNav.prompt.md) |
| `SideNavCollapsible` | A named group inside a SideNav that shows and hides its own contents. It may contain items, sections and further collapsibles to any depth; the indent compounds with depth, which is why SideNav.indentStep is a step rather than a total. It binds the `disclosure` pattern and deliberately does NOT claim to be a treeview: there is no aria-level, no roving tab stop and no arrow navigation, because each collapsible is an independent disclosure. Its expanded state lives in the component, seeded by defaultExpanded, and it additionally opens itself when it COMES TO HOLD SideNav.active -- a transition, not a standing condition, which is what leaves a user free to collapse a group again while the route stays inside it. Implicit behaviour, stated here and in its .prompt.md rather than left to be discovered. | `id*` `label*` `icon` `defaultExpanded` `children` `onToggle` | [`SideNavCollapsible.prompt.md`](./components/navigation/side-nav-collapsible/SideNavCollapsible.prompt.md) |
| `SideNavItem` | One destination in a SideNav. The consumer writes one per destination; the nesting depth it sits at, which id is currently active and how it reports `nav` are settled between it and its parent, and none of that is a member of this contract -- the same shape, and the same reason, as the name, checked state and selection callback a RadioGroup settles with each Radio. It used to be api/types/side-nav-item.json, a predefined object Arena read out of an array; it is an element the consumer writes now, which is what makes a section, a collapsible and arbitrary nesting expressible at all. | `id*` `label*` `icon` `disabled` `badge` `href` | [`SideNavItem.prompt.md`](./components/navigation/side-nav-item/SideNavItem.prompt.md) |
| `SideNavSection` | A named group of navigation items inside a SideNav. It wraps what the consumer wrote and never replaces it; its accessible name is the same heading a sighted user reads. A section always has children -- a childless one is guarded against at runtime, because two shapes would be one more thing a single behaviour binding cannot describe. Having sections at all is optional: loose SideNavItems at the root are legal and may sit beside them. | `label*` `children*` | [`SideNavSection.prompt.md`](./components/navigation/side-nav-section/SideNavSection.prompt.md) |
| `Tab` | One tab in a Tabs strip, and the panel it shows. Tab draws the button; its content fills the tabpanel Tabs renders beside the tablist. | `value*` `label*` `children` | [`Tab.prompt.md`](./components/navigation/tab/Tab.prompt.md) |
| `Tabs` | A row of tabs and the one panel they switch between. Write one `Tab` per view; Tabs renders the tablist, the panel, and the keyboard. | `children` `value` `defaultValue` `onChange` | [`Tabs.prompt.md`](./components/navigation/tabs/Tabs.prompt.md) |

55 components across 7 categories in this layer.
