function getKeyName(node) {
  if (!node) return undefined;

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  return undefined;
}

function getMemberExpressionPropertyName(node) {
  if (node.type !== 'MemberExpression') return undefined;
  if (node.property.type === 'Identifier') {
    return node.property.name;
  }

  if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
    return node.property.value;
  }

  return undefined;
}

function sourceContainsCredentialReference(context, node) {
  const text = context.getSourceCode().getText(node);
  return /(password|token|apiKey|secret)/i.test(text);
}

function isInsideAllowedRedaction(context) {
  const ancestors = context.getAncestors();
  return ancestors.some((ancestor) => {
    if (ancestor.type !== 'CallExpression') {
      return false;
    }

    const callee = ancestor.callee;
    if (callee.type === 'Identifier') {
      return callee.name === 'redactMetadata' || callee.name === 'buildSecureToolResponse';
    }

    return false;
  });
}

const CREDENTIAL_KEYS = new Set(['password', 'token', 'apiKey', 'secret']);

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent credential leakage in responses and logs',
      category: 'Security',
      recommended: true,
    },
    messages: {
      directCredential:
        'Do not include {{ field }} directly in response data. Use {{ field }}Changed: boolean instead.',
      unredactedCommand: 'Command metadata must be redacted. Use buildSecureToolResponse() or redactMetadata().',
      hardcodedCredential: 'Do not hardcode credential values. Use generateSecurePassword().',
    },
  },
  create(context) {
    return {
      ObjectExpression(node) {
        for (const property of node.properties) {
          if (property.type !== 'Property') continue;

          const keyName = getKeyName(property.key);
          if (!keyName || !CREDENTIAL_KEYS.has(keyName)) continue;

          const value = property.value;

          if (value.type === 'Literal' && typeof value.value === 'string' && value.value.length > 0) {
            context.report({ node: property, messageId: 'hardcodedCredential' });
            continue;
          }

          if (value.type === 'MemberExpression') {
            const propertyName = getMemberExpressionPropertyName(value);
            if (propertyName && CREDENTIAL_KEYS.has(propertyName)) {
              context.report({
                node: property,
                messageId: 'directCredential',
                data: { field: keyName },
              });
              continue;
            }
          }

          if (value.type === 'Identifier' && CREDENTIAL_KEYS.has(value.name)) {
            context.report({
              node: property,
              messageId: 'directCredential',
              data: { field: keyName },
            });
            continue;
          }

          if (value.type === 'TemplateLiteral' || value.type === 'BinaryExpression') {
            if (sourceContainsCredentialReference(context, value)) {
              context.report({
                node: property,
                messageId: 'directCredential',
                data: { field: keyName },
              });
            }
          }
        }
      },
      Property(node) {
        const keyName = getKeyName(node.key);
        if (keyName !== 'command') return;
        if (isInsideAllowedRedaction(context)) return;

        const value = node.value;
        if (value.type === 'MemberExpression' || value.type === 'TemplateLiteral' || value.type === 'BinaryExpression') {
          if (sourceContainsCredentialReference(context, value) || value.type === 'MemberExpression') {
            context.report({ node, messageId: 'unredactedCommand' });
          }
        }
      },
    };
  },
};
