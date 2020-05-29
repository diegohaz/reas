import * as React from "react";
import { createComponent } from "reakit-system/createComponent";
import { createHook } from "reakit-system/createHook";
import { useForkRef } from "reakit-utils/useForkRef";
import { useIsomorphicEffect } from "reakit-utils/useIsomorphicEffect";
import { useLiveRef } from "reakit-utils/useLiveRef";
import { warning } from "reakit-warning";
import { hasFocusWithin } from "reakit-utils/hasFocusWithin";
import { isSelfTarget } from "reakit-utils/isSelfTarget";
import { isButton } from "reakit-utils/isButton";
import { isPortalEvent } from "reakit-utils/isPortalEvent";
import { getActiveElement } from "reakit-utils/getActiveElement";
import { getClosestFocusable } from "reakit-utils/tabbable";
import { BoxOptions, BoxHTMLProps, useBox } from "../Box/Box";

export type TabbableOptions = BoxOptions & {
  /**
   * Same as the HTML attribute.
   */
  disabled?: boolean;
  /**
   * When an element is `disabled`, it may still be `focusable`. It works
   * similarly to `readOnly` on form elements. In this case, only
   * `aria-disabled` will be set.
   */
  focusable?: boolean;
};

export type TabbableHTMLProps = BoxHTMLProps & {
  disabled?: boolean;
};

export type TabbableProps = TabbableOptions & TabbableHTMLProps;

function isUserAgent(string: string) {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.indexOf(string) !== -1;
}

const isSafariOrFirefoxOnMac =
  isUserAgent("Mac") &&
  !isUserAgent("Chrome") &&
  (isUserAgent("Safari") || isUserAgent("Firefox"));

// Safari and Firefox on MacOS don't focus on buttons on mouse down like other
// browsers/platforms. Instead, they focus on the closest focusable ancestor
// element, which is ultimately the body element. So we make sure to give focus
// to the tabbable element on mouse down so it works consistently across
// browsers. This also helps with VoiceOver, which doesn't focus on tabbable
// elements when pressing VO+Space (click).
function useFocusOnMouseDown() {
  if (!isSafariOrFirefoxOnMac) return undefined;
  const [element, scheduleFocus] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!element) return;
    if (!hasFocusWithin(element)) {
      element.focus();
    }
    scheduleFocus(null);
  }, [element]);

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const self = event.currentTarget;
      if (isPortalEvent(event)) return;
      // We don't want to perform this action if the event target is not the
      // tabbable element. Unless it's a button element, in which case an inner
      // element could be the target (like an SVG element).
      if (!isSelfTarget(event) && !isButton(self)) return;
      const activeElement = getActiveElement(self);
      if (!activeElement) return;

      const focusSelf = ({ currentTarget, type }: Event) => {
        if (!hasFocusWithin(self)) {
          self.focus();
        }
        currentTarget?.removeEventListener(type, focusSelf);
      };

      const activeElementIsBody = activeElement.tagName === "BODY";
      const focusableAncestor = getClosestFocusable(self.parentElement);

      if (
        activeElement === focusableAncestor ||
        (activeElementIsBody && !focusableAncestor)
      ) {
        // When the active element is the focusable ancestor, it'll not emit
        // focus/blur events. After all, it's already focused. So we can't
        // listen to those events to focus this tabbable element.
        // When the active element is body and there's no focusable ancestor,
        // we also don't have any other event to listen to since body never
        // emits focus/blur events on itself.
        // In both of these cases, we have to schedule focus on this tabbable
        // element (self).
        scheduleFocus(self);
      } else if (focusableAncestor) {
        // Clicking (mouse down) on the tabbable element on Safari and Firefox
        // on MacOS will fire focus on the focusable ancestor element, if
        // there's any and if it's not the current active element. So we wait
        // for this event to happen before moving focus to this element.
        focusableAncestor.addEventListener("focusin", focusSelf);
      } else {
        // Finally, if there's no focsuable ancestor and there's another
        // element with focus, we wait for that element to get blurred before
        // focusing this one.
        activeElement.addEventListener("blur", focusSelf);
      }
    },
    []
  );

  return onMouseDown;
}

function isNativeTabbable(element: Element) {
  return (
    element.tagName === "BUTTON" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "A" ||
    element.tagName === "AUDIO" ||
    element.tagName === "VIDEO"
  );
}

export const useTabbable = createHook<TabbableOptions, TabbableHTMLProps>({
  name: "Tabbable",
  compose: useBox,
  keys: ["disabled", "focusable"],

  useOptions(options, { disabled }) {
    return { disabled, ...options };
  },

  useProps(
    options,
    {
      ref: htmlRef,
      tabIndex: htmlTabIndex,
      onClick: htmlOnClick,
      onMouseDown: htmlOnMouseDown,
      style: htmlStyle,
      ...htmlProps
    }
  ) {
    const ref = React.useRef<HTMLElement>(null);
    const onClickRef = useLiveRef(htmlOnClick);
    const onMouseDownRef = useLiveRef(htmlOnMouseDown);
    const trulyDisabled = options.disabled && !options.focusable;
    const [nativeTabbable, setNativeTabbable] = React.useState(true);
    const tabIndex = nativeTabbable ? htmlTabIndex : htmlTabIndex || 0;
    const style = options.disabled
      ? { pointerEvents: "none" as const, ...htmlStyle }
      : htmlStyle;
    const focusOnMouseDown = useFocusOnMouseDown();

    useIsomorphicEffect(() => {
      const tabbable = ref.current;
      if (!tabbable) {
        warning(
          true,
          "Can't determine if the element is a native tabbable element because `ref` wasn't passed to the component.",
          "See https://reakit.io/docs/tabbable"
        );
        return;
      }
      if (!isNativeTabbable(tabbable)) {
        setNativeTabbable(false);
      }
    }, []);

    const onClick = React.useCallback(
      (event: React.MouseEvent) => {
        if (options.disabled) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }
        onClickRef.current?.(event);
      },
      [options.disabled]
    );

    const onMouseDown = React.useCallback(
      (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (options.disabled) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }
        onMouseDownRef.current?.(event);
        if (event.defaultPrevented) return;
        focusOnMouseDown?.(event);
      },
      [options.disabled, focusOnMouseDown]
    );

    return {
      ref: useForkRef(ref, htmlRef),
      style,
      tabIndex: !trulyDisabled ? tabIndex : undefined,
      disabled: trulyDisabled && nativeTabbable ? true : undefined,
      "aria-disabled": options.disabled ? true : undefined,
      onClick,
      onMouseDown,
      ...htmlProps,
    };
  },
});

export const Tabbable = createComponent({
  as: "div",
  useHook: useTabbable,
});
