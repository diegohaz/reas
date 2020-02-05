import * as React from "react";
import { createComponent } from "reakit-system/createComponent";
import { createHook } from "reakit-system/createHook";
import { HiddenOptions, HiddenHTMLProps, useHidden } from "../Hidden/Hidden";
import { Portal } from "../Portal/Portal";
import { useDialogState, DialogStateReturn } from "./DialogState";
import { DialogBackdropContext } from "./__utils/DialogBackdropContext";

export type DialogBackdropOptions = HiddenOptions &
  Pick<Partial<DialogStateReturn>, "modal">;

export type DialogBackdropHTMLProps = HiddenHTMLProps;

export type DialogBackdropProps = DialogBackdropOptions &
  DialogBackdropHTMLProps;

export const useDialogBackdrop = createHook<
  DialogBackdropOptions,
  DialogBackdropHTMLProps
>({
  name: "DialogBackdrop",
  compose: useHidden,
  useState: useDialogState,

  useOptions({ modal = true, ...options }) {
    return { modal, ...options };
  },

  useProps(options, htmlProps) {
    const wrapChildren = React.useCallback(
      (children: React.ReactNode) => {
        if (options.modal) {
          return (
            <Portal>
              <DialogBackdropContext.Provider value>
                {children}
              </DialogBackdropContext.Provider>
            </Portal>
          );
        }
        return children;
      },
      [options.modal]
    );

    return {
      id: undefined,
      role: undefined,
      unstable_wrap: wrapChildren,
      "data-dialog-ref": options.baseId,
      ...htmlProps
    };
  }
});

export const DialogBackdrop = createComponent({
  as: "div",
  useHook: useDialogBackdrop
});
