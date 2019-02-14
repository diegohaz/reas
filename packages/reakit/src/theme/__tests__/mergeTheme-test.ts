import * as React from "react";
import mergeTheme from "../mergeTheme";

test("single constants", () => {
  const theme = { constants: { a: "a" } };
  const merged = mergeTheme(theme, {});
  expect(merged.constants).toBe(theme.constants);
  expect(merged.constants.a).toBe(theme.constants.a);
});

test("different constants", () => {
  const theme1 = { constants: { a: "a" } };
  const theme2 = { constants: { b: "b" } };
  const merged = mergeTheme(theme1, theme2);
  expect(merged.constants.a).toBe("a");
  expect(merged.constants.b).toBe("b");
});

test("single variables", () => {
  const theme = { variables: { a: "a" } };
  const merged = mergeTheme(theme, {});
  expect(merged.variables).toBe(theme.variables);
  expect(merged.variables.a).toBe(theme.variables.a);
});

test("different variables", () => {
  const theme1 = { variables: { a: "a" } };
  const theme2 = { variables: { b: "b" } };
  const merged = mergeTheme(theme1, theme2);
  expect(merged.variables.a).toBe("a");
  expect(merged.variables.b).toBe("b");
});

test("single dynamos", () => {
  const theme = { dynamos: { a: "a" } };
  const merged = mergeTheme(theme, {});
  expect(merged.dynamos).toBe(theme.dynamos);
  expect(merged.dynamos.a).toBe(theme.dynamos.a);
});

test("different dynamos", () => {
  const theme1 = { dynamos: { a: "a" } };
  const theme2 = { dynamos: { b: "b" } };
  const merged = mergeTheme(theme1, theme2);
  expect(merged.dynamos.a).toBe("a");
  expect(merged.dynamos.b).toBe("b");
});

test("single hooks", () => {
  const useSomething = jest.fn();
  const theme = { hooks: { useSomething } };
  const merged = mergeTheme(theme, {});
  expect(merged.hooks).toEqual({ useSomething });
  expect(merged.hooks.useSomething).toEqual(useSomething);
});

test("different hooks", () => {
  const impl = (
    amount: number,
    props: React.InputHTMLAttributes<any> = {}
  ) => ({ ...props, max: +(props.max || 0) + amount });
  const fn1 = jest.fn(impl);
  const fn2 = jest.fn(impl);
  const theme1 = { hooks: { useSomething: fn1 } };
  const theme2 = { hooks: { useSomething: fn2 } };
  const merged = mergeTheme(theme1, theme2);

  merged.hooks.useSomething(1);

  expect(fn1).toBeCalledWith(1, undefined);
  expect(fn2).toBeCalledWith(1, { max: 1 });
});
