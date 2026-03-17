import type { NotationStandard } from "./notation.types.js";
import {
  CANONICAL_NODE_KINDS,
  CANONICAL_EDGE_KINDS,
} from "../canonical/index.js";

export const defaultNotation: NotationStandard = {
  nodes: {
    package: {
      shape: "rect",
      icon: "📦",
      colorRole: "package",
      stereotype: "«package»",
      defaultLabel: "name",
    },
    module: {
      shape: "rect",
      icon: "📄",
      colorRole: "module",
      stereotype: "«module»",
      defaultLabel: "name",
    },
    class: {
      shape: "rect",
      icon: "C",
      colorRole: "class",
      compartments: true,
      defaultLabel: "name",
    },
    interface: {
      shape: "rect",
      icon: "I",
      colorRole: "interface",
      stereotype: "«interface»",
      compartments: true,
      defaultLabel: "name",
    },
    function: {
      shape: "roundedRect",
      icon: "ƒ",
      colorRole: "function",
      defaultLabel: "name",
    },
    field: {
      shape: "rect",
      icon: "≡",
      colorRole: "field",
      defaultLabel: "name",
    },
    variable: {
      shape: "rect",
      icon: "x",
      colorRole: "variable",
      defaultLabel: "name",
    },
    enum: {
      shape: "rect",
      icon: "◇",
      colorRole: "enum",
      stereotype: "«enum»",
      compartments: true,
      defaultLabel: "name",
    },
    typeAlias: {
      shape: "hexagon",
      icon: "T",
      colorRole: "typeAlias",
      stereotype: "«type»",
      defaultLabel: "name",
    },
    cfgBlock: {
      shape: "roundedRect",
      icon: "▶",
      colorRole: "cfgBlock",
      defaultLabel: "name",
    },
    expression: {
      shape: "pill",
      icon: "·",
      colorRole: "expression",
      defaultLabel: "name",
    },
  },
  edges: {
    containment: {
      lineStyle: "solid",
      arrowHead: "diamond",
      colorRole: "neutral",
    },
    inheritance: {
      lineStyle: "solid",
      arrowHead: "triangle",
      colorRole: "class",
      label: "extends",
    },
    implements: {
      lineStyle: "dashed",
      arrowHead: "triangle",
      colorRole: "interface",
      label: "implements",
    },
    import: {
      lineStyle: "dashed",
      arrowHead: "vee",
      colorRole: "module",
    },
    invocation: {
      lineStyle: "dotted",
      arrowHead: "vee",
      colorRole: "function",
      label: "calls",
    },
    access: {
      lineStyle: "dotted",
      arrowHead: "vee",
      colorRole: "field",
    },
    dependency: {
      lineStyle: "dashed",
      arrowHead: "vee",
      colorRole: "neutral",
    },
    controlFlow: {
      lineStyle: "solid",
      arrowHead: "vee",
      colorRole: "cfgBlock",
    },
    dataFlow: {
      lineStyle: "dashed",
      arrowHead: "vee",
      colorRole: "expression",
      label: "data",
    },
  },
};

/** Validate that a notation standard covers all canonical kinds. */
export function validateNotation(
  notation: NotationStandard,
): readonly string[] {
  const errors: string[] = [];

  for (const kind of CANONICAL_NODE_KINDS) {
    if (!(kind in notation.nodes)) {
      errors.push(`Missing node notation for kind "${kind}"`);
    }
  }
  for (const kind of CANONICAL_EDGE_KINDS) {
    if (!(kind in notation.edges)) {
      errors.push(`Missing edge notation for kind "${kind}"`);
    }
  }

  return errors;
}
