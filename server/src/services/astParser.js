/**
 * @fileoverview AST-based Static Analysis Engine for CodePulse AI
 * Parses JavaScript code into an AST using esprima to derive:
 * - Time Complexity (Big-O) from loop nesting depth
 * - Space Complexity from allocation patterns
 * - Health Score (0-100) based on code quality heuristics
 * 
 * This runs BEFORE the AI call to provide deterministic complexity analysis.
 */

import * as esprima from 'esprima';

/**
 * Loop node types recognized by the AST walker
 */
const LOOP_TYPES = [
  'ForStatement',
  'WhileStatement',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement'
];

/**
 * Built-in methods that imply O(N) iteration
 */
const LINEAR_METHODS = ['includes', 'indexOf', 'find', 'findIndex', 'filter', 'map', 'forEach', 'reduce', 'some', 'every'];

/**
 * Built-in methods that imply O(N log N)
 */
const SORT_METHODS = ['sort'];

/**
 * Complexity labels ordered by severity
 */
const COMPLEXITY_LABELS = ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)', 'O(N²)', 'O(N³)', 'O(2^N)'];

/**
 * Maps a numeric loop depth to a Big-O complexity string
 * @param {number} depth - Maximum loop nesting depth
 * @param {Object} flags - Additional complexity flags
 * @returns {string} Big-O complexity string
 */
function depthToComplexity(depth, flags = {}) {
  if (flags.hasRecursion) return 'O(2^N)';
  if (flags.hasSortInLoop) return 'O(N² log N)';

  switch (depth) {
    case 0: return flags.hasSort ? 'O(N log N)' : flags.hasLinearMethod ? 'O(N)' : 'O(1)';
    case 1: return flags.hasLinearMethodInLoop ? 'O(N²)' : flags.hasSort ? 'O(N² log N)' : 'O(N)';
    case 2: return 'O(N²)';
    case 3: return 'O(N³)';
    default: return `O(N^${depth})`;
  }
}

/**
 * Recursively walks the AST to find loops and calculate nesting depth
 * @param {Object} node - AST node
 * @param {number} currentDepth - Current loop nesting depth
 * @param {Array} loops - Accumulator for found loop details
 * @param {Object} flags - Mutable flags for special patterns
 * @param {Set} functionNames - Set of declared function names (for recursion detection)
 */
function walkAST(node, currentDepth, loops, flags, functionNames) {
  if (!node || typeof node !== 'object') return;

  // Track function declarations for recursion detection
  if (node.type === 'FunctionDeclaration' && node.id) {
    functionNames.add(node.id.name);
  }

  // Detect recursive calls
  if (node.type === 'CallExpression' && node.callee) {
    if (node.callee.type === 'Identifier' && functionNames.has(node.callee.name)) {
      flags.hasRecursion = true;
    }
  }

  // Detect .sort() calls
  if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
    const methodName = node.callee.property?.name;
    if (SORT_METHODS.includes(methodName)) {
      if (currentDepth > 0) {
        flags.hasSortInLoop = true;
      } else {
        flags.hasSort = true;
      }
    }
    // Detect linear methods like .includes(), .indexOf() inside loops
    if (LINEAR_METHODS.includes(methodName)) {
      if (currentDepth > 0) {
        flags.hasLinearMethodInLoop = true;
      } else {
        flags.hasLinearMethod = true;
      }
    }
  }

  // Detect array/object allocations for space complexity
  if (node.type === 'ArrayExpression' || node.type === 'ObjectExpression') {
    if (currentDepth > 0) {
      flags.allocationsInLoop = (flags.allocationsInLoop || 0) + 1;
    } else {
      flags.allocationsOutsideLoop = (flags.allocationsOutsideLoop || 0) + 1;
    }
  }

  // Detect new Array() or new Object() or new Map() etc.
  if (node.type === 'NewExpression') {
    if (currentDepth > 0) {
      flags.allocationsInLoop = (flags.allocationsInLoop || 0) + 1;
    }
  }

  // Process loop nodes
  if (LOOP_TYPES.includes(node.type)) {
    const newDepth = currentDepth + 1;
    flags.maxDepth = Math.max(flags.maxDepth || 0, newDepth);

    loops.push({
      type: node.type,
      depth: newDepth,
      startLine: node.loc?.start?.line || 0,
      endLine: node.loc?.end?.line || 0,
      estimatedComplexity: depthToComplexity(newDepth, {})
    });

    // Continue walking children with increased depth
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => walkAST(c, newDepth, loops, flags, functionNames));
      } else if (child && typeof child === 'object' && child.type) {
        walkAST(child, newDepth, loops, flags, functionNames);
      }
    }
    return; // Don't process children again below
  }

  // Walk all children at current depth
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach(c => walkAST(c, currentDepth, loops, flags, functionNames));
    } else if (child && typeof child === 'object' && child.type) {
      walkAST(child, currentDepth, loops, flags, functionNames);
    }
  }
}

/**
 * Calculates a health score (0-100) based on code quality heuristics
 * @param {Object} ast - Parsed AST
 * @param {string} code - Raw code string
 * @param {Object} flags - Flags from AST walk
 * @param {Array} loops - Detected loops
 * @returns {Object} Score breakdown with total and deductions
 */
function calculateHealthScore(ast, code, flags, loops) {
  let score = 100;
  const deductions = [];

  // Check for nested loops (deeper = worse)
  const maxDepth = flags.maxDepth || 0;
  if (maxDepth >= 2) {
    const penalty = (maxDepth - 1) * 15;
    score -= penalty;
    deductions.push({ reason: `Nested loops (depth ${maxDepth})`, penalty });
  }

  // Check for 'var' usage (should use let/const)
  const varMatches = code.match(/\bvar\s+/g);
  if (varMatches) {
    const penalty = Math.min(varMatches.length * 5, 15);
    score -= penalty;
    deductions.push({ reason: `'var' usage (${varMatches.length} occurrences)`, penalty });
  }

  // Check for console.log statements
  const consoleMatches = code.match(/console\.(log|warn|error|info)\s*\(/g);
  if (consoleMatches) {
    const penalty = Math.min(consoleMatches.length * 3, 12);
    score -= penalty;
    deductions.push({ reason: `console statements (${consoleMatches.length})`, penalty });
  }

  // Check for error handling (try/catch)
  const hasTryCatch = code.includes('try') && code.includes('catch');
  const hasAsyncAwait = code.includes('async') || code.includes('await') || code.includes('.then(');
  if (hasAsyncAwait && !hasTryCatch) {
    score -= 10;
    deductions.push({ reason: 'Async code without error handling', penalty: 10 });
  }

  // Check for magic numbers (numbers other than 0, 1, 2 used directly)
  const magicNumbers = code.match(/(?<![a-zA-Z_$])\b\d{2,}\b(?![a-zA-Z_$])/g);
  if (magicNumbers && magicNumbers.length > 2) {
    score -= 5;
    deductions.push({ reason: `Magic numbers detected (${magicNumbers.length})`, penalty: 5 });
  }

  // Check for very long functions (>50 lines between function braces)
  const lines = code.split('\n');
  if (lines.length > 50) {
    score -= 10;
    deductions.push({ reason: `Long function (${lines.length} lines)`, penalty: 10 });
  }

  // Check for deeply nested callbacks (callback hell)
  let maxIndent = 0;
  lines.forEach(line => {
    const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
    const indentLevel = Math.floor(leadingSpaces / 2);
    maxIndent = Math.max(maxIndent, indentLevel);
  });
  if (maxIndent > 6) {
    score -= 10;
    deductions.push({ reason: `Deep nesting (${maxIndent} levels)`, penalty: 10 });
  }

  // Check for recursion without base case detection
  if (flags.hasRecursion) {
    score -= 5;
    deductions.push({ reason: 'Recursive function detected (verify base case)', penalty: 5 });
  }

  // Bonus: has comments
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*'));
  if (commentLines.length === 0 && lines.length > 10) {
    score -= 5;
    deductions.push({ reason: 'No comments in code', penalty: 5 });
  }

  return {
    total: Math.max(0, Math.min(100, score)),
    deductions
  };
}

/**
 * Determines space complexity based on allocation patterns
 * @param {Object} flags - Flags from AST walk
 * @returns {string} Space complexity string
 */
function deriveSpaceComplexity(flags) {
  if (flags.hasRecursion) return 'O(N)'; // Recursion stack
  if (flags.allocationsInLoop > 0) return 'O(N)';
  if (flags.allocationsOutsideLoop > 0) return 'O(1)';
  return 'O(1)';
}

/**
 * Generic heuristic static analysis for languages like Java, Python, C++, Go, etc.
 * Computes loop nesting depth, Big-O time & space complexities, and lines of code.
 */
function analyzeGenericLanguageCode(codeString, language) {
  const lines = codeString.split('\n');
  const loc = lines.filter(l => l.trim().length > 0).length;

  let maxLoopDepth = 0;
  let currentLoopDepth = 0;
  let braceLevel = 0;
  const loopStack = [];
  const loops = [];
  const issues = [];
  const deductions = [];

  const lang = (language || '').toLowerCase();
  const isPython = lang === 'python';

  let hasDataStructureAllocation = false;
  let hasRecursion = false;

  const loopRegex = isPython 
    ? /^\s*(for|while)\b/ 
    : /\b(for|while|do)\b/;

  const dsPatterns = [
    /\bnew\s+(HashMap|ArrayList|HashSet|TreeMap|LinkedList|Vector|Array|Map|Set|int|double|String|Object)\s*(\[|<|\()/i,
    /\b(std::vector|std::map|std::unordered_map|std::set|std::list)\b/i,
    /\bmake\s*\(\s*(map|\[\])/i,
    /\b(dict|set|list)\s*\(/i,
    /=\s*(\{\}|\[\])/
  ];

  // 1. Structural Syntax Checks: Unbalanced Braces / Parentheses
  const openBraces = (codeString.match(/\{/g) || []).length;
  const closeBraces = (codeString.match(/\}/g) || []).length;
  if (!isPython && openBraces !== closeBraces) {
    issues.push({
      type: 'correctness',
      severity: 'critical',
      title: 'Syntax Error: Unbalanced Braces',
      description: `Mismatched curly braces detected. Found ${openBraces} opening '{' and ${closeBraces} closing '}'.`,
      suggestion: 'Ensure every opening brace has a matching closing brace.'
    });
  }

  // Only check parentheses mismatch if the difference is more than 1
  // (small off-by-one can happen in template/generics code)
  const openParens = (codeString.match(/\(/g) || []).length;
  const closeParens = (codeString.match(/\)/g) || []).length;
  if (Math.abs(openParens - closeParens) > 1) {
    issues.push({
      type: 'correctness',
      severity: 'critical',
      title: 'Syntax Error: Mismatched Parentheses',
      description: `Found ${openParens} opening '(' and ${closeParens} closing ')'. Please check your parentheses.`,
      suggestion: 'Check parentheses alignment.'
    });
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return;

    // Check data structure allocation
    if (dsPatterns.some(p => p.test(trimmed))) {
      hasDataStructureAllocation = true;
    }

    // Check invalid assignment like 'var x = ;' or 'int x = ;' or 'let a = ;'
    if (/(?:var|let|const|int|float|double|String|auto)\s+[a-zA-Z0-9_$]+\s*=\s*;/.test(trimmed)) {
      issues.push({
        type: 'correctness',
        severity: 'critical',
        title: 'Syntax Error: Missing Assignment Expression',
        lineNumber: index + 1,
        description: `Line ${index + 1}: Variable assigned with '=' but no value or expression was provided before semicolon.`,
        suggestion: 'Provide a valid value or expression on the right side of assignment.'
      });
    }

    // Check division by zero
    if (/\/[\s]*0(?![0-9.])/.test(trimmed)) {
      issues.push({
        type: 'correctness',
        severity: 'critical',
        title: 'Logical Error: Division by Zero',
        lineNumber: index + 1,
        description: `Line ${index + 1}: Expression divides directly by zero which causes an Arithmetic Exception or Infinity.`,
        suggestion: 'Ensure the divisor is non-zero before dividing.'
      });
    }

    // Check Python missing colon after def / if / for / while
    if (isPython && /^\s*(def|if|elif|else|for|while)\b/.test(trimmed) && !trimmed.endsWith(':')) {
      issues.push({
        type: 'correctness',
        severity: 'critical',
        title: 'Python Syntax Error: Missing Colon',
        lineNumber: index + 1,
        description: `Line ${index + 1}: Python '${trimmed.split(/\s+/)[0]}' statement must end with a colon ':'.`,
        suggestion: `Add a colon ':' at the end of line ${index + 1}.`
      });
    }

    if (isPython) {
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[0].length : 0;
      
      while (loopStack.length > 0 && indent <= loopStack[loopStack.length - 1].indent) {
        loopStack.pop();
      }

      if (loopRegex.test(trimmed)) {
        loopStack.push({ indent, line: index + 1 });
        const depth = loopStack.length;
        maxLoopDepth = Math.max(maxLoopDepth, depth);
        loops.push({ type: 'Loop', depth, startLine: index + 1 });
      }
    } else {
      const opens = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;

      if (loopRegex.test(trimmed)) {
        currentLoopDepth++;
        maxLoopDepth = Math.max(maxLoopDepth, currentLoopDepth);
        loopStack.push({ targetBraceLevel: braceLevel + opens, line: index + 1 });
        loops.push({ type: 'Loop', depth: currentLoopDepth, startLine: index + 1 });
      }

      braceLevel += (opens - closes);

      while (loopStack.length > 0 && braceLevel < loopStack[loopStack.length - 1].targetBraceLevel) {
        loopStack.pop();
        currentLoopDepth = Math.max(0, currentLoopDepth - 1);
      }
    }
  });

  const timeComplexity = depthToComplexity(maxLoopDepth, { hasRecursion });
  const spaceComplexity = hasDataStructureAllocation ? 'O(N)' : 'O(1)';

  let healthScore = 95;
  if (maxLoopDepth >= 2) {
    const penalty = (maxLoopDepth - 1) * 15;
    healthScore -= penalty;
    issues.push({
      type: 'performance',
      severity: maxLoopDepth >= 3 ? 'critical' : 'warning',
      title: `Nested loops detected (depth: ${maxLoopDepth})`,
      description: `Code contains ${maxLoopDepth}-level nested loops resulting in ${timeComplexity} time complexity.`,
      suggestion: 'Consider using a hash map or Set lookup table.'
    });
  }

  // Deduct health score severely for syntax / correctness errors
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    healthScore = Math.max(10, healthScore - (criticalCount * 35));
  }

  return {
    timeComplexity,
    spaceComplexity,
    healthScore: Math.max(0, Math.min(100, healthScore)),
    loopDepth: maxLoopDepth,
    loops,
    issues,
    deductions,
    astValid: criticalCount === 0,
    parseError: criticalCount > 0 ? issues.find(i => i.severity === 'critical')?.description : null,
    linesOfCode: loc
  };
}

/**
 * Main analysis function — parses code and returns comprehensive analysis
 * @param {string} codeString - The source code to analyze
 * @param {string} [language='javascript'] - Programming language
 * @returns {Object} Complete analysis result
 */
export function analyzeCode(codeString, language = 'javascript') {
  const normLang = (language || 'javascript').toLowerCase();

  // For non-JS/TS languages, use multi-language heuristic analysis
  if (normLang !== 'javascript' && normLang !== 'typescript') {
    return analyzeGenericLanguageCode(codeString, language);
  }

  try {
    // Parse the code into an AST with location info
    const ast = esprima.parseScript(codeString, {
      loc: true,
      range: true,
      tolerant: true,
      jsx: false
    });

    const loops = [];
    const flags = {
      maxDepth: 0,
      hasRecursion: false,
      hasSort: false,
      hasSortInLoop: false,
      hasLinearMethod: false,
      hasLinearMethodInLoop: false,
      allocationsInLoop: 0,
      allocationsOutsideLoop: 0
    };
    const functionNames = new Set();

    // Walk the entire AST
    walkAST(ast, 0, loops, flags, functionNames);

    // Derive complexities
    const timeComplexity = depthToComplexity(flags.maxDepth, flags);
    const spaceComplexity = deriveSpaceComplexity(flags);

    // Calculate health score
    const healthResult = calculateHealthScore(ast, codeString, flags, loops);

    // Collect issues
    const issues = [];
    if (flags.maxDepth >= 2) {
      issues.push({
        type: 'performance',
        severity: flags.maxDepth >= 3 ? 'critical' : 'warning',
        title: `Nested loops detected (depth: ${flags.maxDepth})`,
        description: `Code has ${flags.maxDepth}-level nested loops resulting in ${timeComplexity} time complexity.`,
        suggestion: 'Consider using a hash map or Set to reduce nested iteration.'
      });
    }
    if (flags.hasRecursion) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        title: 'Recursive function detected',
        description: 'Recursive functions can cause stack overflow for large inputs.',
        suggestion: 'Add memoization or convert to iterative approach if possible.'
      });
    }
    if (flags.hasLinearMethodInLoop) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        title: 'Linear search inside loop',
        description: 'Using .includes()/.indexOf() inside a loop creates O(N²) complexity.',
        suggestion: 'Convert the array to a Set before the loop for O(1) lookups.'
      });
    }

    // Add deductions as issues
    healthResult.deductions.forEach(d => {
      if (!issues.some(i => i.title.includes(d.reason.split('(')[0].trim()))) {
        issues.push({
          type: 'best_practice',
          severity: d.penalty >= 10 ? 'warning' : 'info',
          title: d.reason,
          description: `Health score deduction: -${d.penalty} points`,
          suggestion: ''
        });
      }
    });

    return {
      timeComplexity,
      spaceComplexity,
      healthScore: healthResult.total,
      loopDepth: flags.maxDepth,
      loops,
      issues,
      deductions: healthResult.deductions,
      astValid: true,
      parseError: null,
      linesOfCode: codeString.split('\n').filter(l => l.trim()).length
    };

  } catch (error) {
    // Parse error — return graceful fallback
    return {
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      healthScore: 50,
      loopDepth: 0,
      loops: [],
      issues: [{
        type: 'bug',
        severity: 'critical',
        title: 'Syntax Error',
        description: error.message,
        suggestion: 'Fix the syntax error before analysis can complete.'
      }],
      deductions: [],
      astValid: false,
      parseError: error.message,
      linesOfCode: codeString.split('\n').filter(l => l.trim()).length
    };
  }
}
