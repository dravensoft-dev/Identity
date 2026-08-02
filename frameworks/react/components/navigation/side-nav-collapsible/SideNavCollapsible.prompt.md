A named group inside a `SideNav` that shows and hides its own contents -- a real
`<button>` that toggles the region under it. It is the `disclosure` pattern, and it is
**not** a treeview.

```tsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavSection label="Workspace">
    <SideNavCollapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments">
      <SideNavItem id="prod" label="Production" href="/deploys/prod" />
      <SideNavItem id="staging" label="Staging" href="/deploys/staging" />
    </SideNavCollapsible>
  </SideNavSection>
</SideNav>
```

The trigger carries `aria-expanded` and an `aria-controls` naming the region it toggles.
The region is **always rendered** and hidden while collapsed, so `aria-controls` never
points at nothing; both `hidden` and the inline `display` are driven by the same state,
because an inline `display: flex` would otherwise beat `[hidden]`'s `display: none` and
leave a "hidden" region on screen. Enter and Space work because the trigger is a native
`<button type="button">` and nothing here intercepts either key.

`id` is required, and it is what both DOM ids are derived from: the trigger is
`${id}-trigger` and the region is `${id}-region`. Two attributes have to name elements
that exist -- the trigger's `aria-controls` and the region's `aria-labelledby` -- and
neither is conditional, so there is no shape of this component in which the id goes
unused. A group is a thing you name anyway. A side benefit of deriving both from your
value rather than generating them: you can point an `aria-describedby`, a deep link or a
test hook at either element, which a `useId()` value would make impossible.
`SideNavSection` needs none of this -- its heading id is internal -- so it generates its
own and declares no `id` at all.

`icon` is optional and is a Phosphor class name Arena draws, never markup you pass -- the
single-icon convention, the same one `SideNavItem.icon` follows. **The expand/collapse
caret is not this member**: Arena draws that one itself from the expanded state, so `icon`
is the group's own glyph and setting it never replaces the caret.

`defaultExpanded` **defaults to `false`** -- a collapsible starts shut unless you say
otherwise, or unless it holds the active destination, which the next section covers.

## The group opens itself around the active destination

**This is implicit behaviour, and it is stated here rather than left to be discovered.**
When the subtree a collapsible holds contains a `SideNavItem` whose `id` is the enclosing
`SideNav`'s `active`, the group opens -- on the first render, including the server pass,
and again on every later route change that moves the active destination into it. You do
not have to compute `defaultExpanded` from the route yourself.

Two consequences worth holding on to:

- **`onToggle` does not fire for it.** It reports the button press and nothing else,
  because the automatic expansion is Arena's decision rather than the user's -- persisting
  it as a user preference would record something the user never chose.
- **You can still collapse it.** The state is the component's own, not derived from the
  route, so a group holding the active item shuts when you press its trigger and stays
  shut until the active destination moves into it again.
- **And it stays shut while the active destination moves *within* it.** The auto-expand
  fires on the group coming to hold the active item -- a transition -- not on it holding
  one. So if you collapse a group and the route then moves from one item inside it to
  another inside the same group, nothing has changed about whether the group holds the
  active destination, the group does not reopen, and the current item is hidden inside a
  shut group until the route leaves and returns. That is the price of letting you collapse
  a group holding the active item at all: a rule that reopened it on every route change
  would take that away.

## Do / Don't

- **Do** give the collapsible an `id` distinct from any destination's. It names the group,
  not a place -- the group opens around the active item by matching the `SideNavItem`
  elements inside it, never by comparing its own id to `active`.
- **Do** nest freely. A collapsible may hold sections and further collapsibles, and each
  level indents one `indentStep` deeper than the last, compounded -- see `SideNav.indentStep`.
- **Don't** expect arrow keys, `aria-level` or a roving tab stop. Each collapsible is an
  independent disclosure, so Tab moves through the triggers and the visible links in order
  and a collapsed region is skipped because it is hidden. If you genuinely need treeview
  semantics, this is not the component.
- **Don't** drive `defaultExpanded` from state you update on every toggle. It is a seed
  read once; wire `onToggle` to your own store if you want the group's state to persist,
  and leave `defaultExpanded` as that store's initial value.
- **Don't** leave `id` or `label` blank. Both are required and guarded: a blank `label`
  leaves the trigger with no accessible name, and a blank `id` produces the id pair
  `-trigger`/`-region`, which every other blank-id collapsible on the page would share.
- **Don't** wrap its children in a fragment or a component of your own. It injects into
  the children it is handed, and `React.Children.toArray` does not see through a `<>...</>`
  -- the same limit `SideNav` and `SideNavSection` carry.

## Verifying the disclosure by hand

**Two halves of this component are not machine-checkable, and neither is unverified
because it is unimportant.** happy-dom does not synthesise a click from a keydown on a
native button, so no suite can prove Enter and Space actually toggle the region -- what
`SideNav.disclosure.dom.test.` proves instead is that the trigger is a native
`<button type="button">`, that no handler of ours cancels either key, and that a click
toggles, which together make the platform's activation the only remaining link. And
happy-dom has no sequential focus navigation at all, so a Tab keypress plus
`document.activeElement` would pass identically against a correct implementation and
against none; that suite asserts the structural half instead (the links sit inside
`[hidden]` while collapsed, and nothing adds a `tabindex`).

Serve the tree with `bun run demos`, open
`frameworks/react/components/navigation/side-nav-collapsible/SideNavCollapsible.demo.generated.html`, and check all of:

1. The `Deployments` group is **already open** on first paint. `active="prod"` names an
   item inside it, so this is the auto-expand, not a `defaultExpanded`. A probe testing
   an *opening* transition has to close it first.
2. Click into the page, Tab to the `Deployments` trigger, and press **Enter**. The region
   closes: the caret flips from `ph-caret-down` to `ph-caret-right`, `aria-expanded` goes
   to `false`, and the two links vanish. Press Enter again and all three reverse. Check
   the caret and `aria-expanded` *together* -- a caret driven by a second piece of state
   could disagree with the attribute and only the eye would catch it.
3. Repeat step 2 with **Space**. It must behave identically. Space activates a native
   button on key*up* rather than key*down*, so a handler that intercepted only one of the
   two keys would show up here and nowhere else.
4. With the group **expanded**, Tab forward from the trigger. Focus must go
   `Deployments` -> `Production` -> `Staging` -> `Settings` -> and only then leave the
   bar. Reaching something behind the sidebar before `Settings` means focus escaped.
5. With the group **collapsed**, Tab forward from the trigger. Focus must go
   `Deployments` -> `Settings` directly, skipping both hidden links. Landing on
   `Production` while it is invisible is the defect this step exists for.
6. The indent compounds with depth and is real, measurable padding, not a margin trick:
   the root item sits at 12px, the trigger one step in at 24px, and the items inside it
   at 36px, each step one `indentStep` of `--sp-1`.

**Verified in Chromium 150 on 2026-07-26**, all six. Steps 2 through 5 were additionally
driven through CDP with real `Input.dispatchKeyEvent` key events, and the observed
sequences are exactly the ones written above.
