import path from "node:path";
import type { Rule } from 'eslint';
import type { AST } from 'jsonc-eslint-parser';
import {
  getAlwaysAllowed,
  getVars,
  getArrayProperty,
  getObjectProperty,
  getValueLoc,
  getKeyLoc
} from "./helpers/tokenAst.ts";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Validate token prefix relationships"
    },
    schema: [],
    messages: {
      invalidAllowed:
        '"{{prefix}}" is already part of alwaysAllowed',

      invalidExclude:
        '"{{prefix}}" cannot be excluded because it is not alwaysAllowed',

      conflict:
        '"{{prefix}}" cannot exist in both allowed and exclude',

      invalidValuePrefix:
        '"{{prefix}}" is not declared as allowed or alwaysAllowed',

      excludedValuePrefix:
        '"{{prefix}}" cannot be used because it is excluded',

      invalidVariable:
        '"{{key}}" must be camelCase',

      invalidValueSelfReference:
        `"{{prefix}}" cannot reference itself`
    }
  },

  create(context) {
    const filename = context.filename.split(path.sep).join("/");

    if (!filename.endsWith(".json") && !filename.endsWith(".jsonc")) {
      return {};
    }

    return {
      Program(node) {
        const jsonNode = node as unknown as AST.JSONProgram;
        const statement = jsonNode.body[0];

        if (
          !statement ||
          statement.type !== "JSONExpressionStatement"
        ) {
          return;
        }

        const root = statement.expression;

        if (!root || root.type !== "JSONObjectExpression") {
          return;
        }

        const alwaysAllowed = getAlwaysAllowed(root);
        const vars = getVars(root);

        for (const variable of vars) {
          const allowed = getArrayProperty(variable.value, "allowed");
          const exclude = getArrayProperty(variable.value, "exclude");
          const values = getObjectProperty(variable.value, "values");
          const totalAllowed = new Set([...alwaysAllowed.values, ...allowed.values]);
          // const variableName = variable.key

          if (!/^[a-z][a-zA-Z0-9]*$/.test(variable.name)) {
            context.report({
              loc: getKeyLoc(variable.key),
              messageId: "invalidVariable",
              data: { key: variable.name }
            });
          }

          for (const entry of allowed.entries) {
            const prefix = entry.value;

            if (alwaysAllowed.values.includes(prefix)) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "invalidAllowed",
                data: { prefix }
              });
            }
          }

          for (const entry of exclude.entries) {
            const prefix = entry.value

            if (!alwaysAllowed.values.includes(prefix)) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "invalidExclude",
                data: { prefix }
              });
            }
            if (allowed.values.includes(prefix)) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "conflict",
                data: { prefix }
              });
            }
          }

          for (const entry of values.entries) {
            const prefix = entry.key;

            if (!totalAllowed.has(prefix)) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "invalidValuePrefix",
                data: { prefix }
              });
              continue
            }
            if (exclude.values.includes(prefix)) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "excludedValuePrefix",
                data: { prefix }
              });
            }
            if (entry.value === prefix) {
              context.report({
                loc: getValueLoc(entry.node),
                messageId: "invalidValueSelfReference",
                data: { prefix }
              });
            }
          }
        }
      }
    };
  }
};

export default rule;