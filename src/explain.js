// explain.js — rule-based séance explanations + deletion-safety ratings.
// No LLM calls. Every explanation is derived from analysis data and says so.

export function explain(item) {
  const base = {
    function: {
      safe: null,
      caution: `Nothing in the analysed file set calls ${q(item.name)}. It may still be called from outside the analysed set (another repo, a published package, a script).`,
      risky: `This symbol is referenced in ways the analyser cannot fully see (dynamic dispatch, framework conventions). Bury only after a manual search.`,
    },
    class: {
      caution: `No code in the analysed file set instantiates or extends ${q(item.name)}. It may still be used outside the analysed set.`,
    },
    export: {
      caution: `No file in the analysed set imports ${q(item.name)}. External consumers (other repos, published packages) cannot be seen by this tool.`,
    },
    import: {
      safe: `Imported but never used in this file. Deleting the import line cannot change behaviour.`,
    },
    unreachable: {
      safe: `This code sits after a return, throw, break, or continue and can never execute. Deleting it cannot change behaviour.`,
    },
    variable: {
      caution: `Nothing in the analysed file set reads ${q(item.name)}. It may still be read from outside the analysed set.`,
    },
  };

  const kindText = base[item.kind] || base.function;
  let safety = 'caution';
  let text = '';
  if (item.kind === 'import' || item.kind === 'unreachable') {
    safety = 'safe';
    text = kindText.safe;
  } else if (item.risky) {
    safety = 'risky';
    text = (base[item.kind] && base[item.kind].risky) || kindText.caution;
  } else {
    safety = 'caution';
    text = kindText.caution || kindText.safe || '';
  }

  const what = describe(item);
  return {
    safety,
    text: `${what} ${text} (Rule-based explanation — no AI judgement was involved.)`,
  };
}

function q(name) {
  return '`' + name + '`';
}

function describe(item) {
  switch (item.kind) {
    case 'function': return `Function ${q(item.name)} (${item.file}:${item.line}) is dead.`;
    case 'class': return `Class ${q(item.name)} (${item.file}:${item.line}) is dead.`;
    case 'export': return `Export ${q(item.name)} (${item.file}:${item.line}) is never imported by any file in this set.`;
    case 'import': return `Import ${q(item.name)} (${item.file}:${item.line}) is never used.`;
    case 'unreachable': return `Unreachable code (${item.file}:${item.line}).`;
    case 'variable': return `Variable ${q(item.name)} (${item.file}:${item.line}) is never read.`;
    default: return `Dead code (${item.file}:${item.line}).`;
  }
}
