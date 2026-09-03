/**
 * Intelligent Pattern Recognizer and Text-to-Diagram Generator for MiLEARNAPP
 * Converts natural language text, step lists, arrows, and hierarchies into valid Mermaid diagrams.
 */

export interface DiagramConversionResult {
  chartCode: string;
  detectedType: 'flowchart' | 'mindmap' | 'sequence' | 'state' | 'generic';
  explanation: string;
}

export function scanTextToDiagram(rawText: string): DiagramConversionResult {
  const text = rawText.trim();
  if (!text) {
    return {
      chartCode: `graph TD\n  Start([Start]) --> Process[Process Activity] --> Complete([Complete])`,
      detectedType: 'generic',
      explanation: 'Starter Flowchart'
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Pattern 1: Arrow / Flowchain pattern (e.g. "A -> B -> C" or "Input => Process => Output")
  const arrowMatch = text.match(/(?:->|-->|=>|==>)/g);
  if (arrowMatch && arrowMatch.length >= 1) {
    const rawSegments = text.split(/(?:->|-->|=>|==>|\n)+/);
    const steps = rawSegments
      .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((s) => s.length > 0);

    if (steps.length >= 2) {
      let flowchart = 'graph TD\n';
      for (let i = 0; i < steps.length; i++) {
        const id = `Node${i + 1}`;
        const label = sanitizeLabel(steps[i]);
        if (i === 0) {
          flowchart += `  ${id}([${label}])\n`;
        } else if (i === steps.length - 1) {
          flowchart += `  ${id}([${label}])\n`;
        } else {
          flowchart += `  ${id}[${label}]\n`;
        }

        if (i > 0) {
          const prevId = `Node${i}`;
          flowchart += `  ${prevId} --> ${id}\n`;
        }
      }
      return {
        chartCode: flowchart.trim(),
        detectedType: 'flowchart',
        explanation: `Generated Flowchart with ${steps.length} sequential nodes.`
      };
    }
  }

  // Pattern 2: Numbered Step List (e.g. "1. First step", "2. Second step")
  const numberedSteps = lines.filter((l) => /^\d+[\.\)]\s+/.test(l));
  if (numberedSteps.length >= 2 && numberedSteps.length >= lines.length * 0.5) {
    let flowchart = 'graph TD\n';
    const steps = numberedSteps.map((l) => l.replace(/^\d+[\.\)]\s+/, '').trim());

    for (let i = 0; i < steps.length; i++) {
      const id = `Step${i + 1}`;
      const label = sanitizeLabel(steps[i]);
      flowchart += `  ${id}["Step ${i + 1}: ${label}"]\n`;
      if (i > 0) {
        flowchart += `  Step${i} --> ${id}\n`;
      }
    }
    return {
      chartCode: flowchart.trim(),
      detectedType: 'flowchart',
      explanation: `Generated Step-by-Step Process with ${steps.length} steps.`
    };
  }

  // Pattern 3: Hierarchical Indented Outline -> Mindmap
  const rawIndentedLines = rawText.split('\n').filter((l) => l.trim());
  const hasIndents = rawIndentedLines.some((l) => /^\s{2,}/.test(l) || /^\t/.test(l));
  if (hasIndents && rawIndentedLines.length >= 3) {
    let mindmap = 'mindmap\n';
    const rootLine = rawIndentedLines[0].trim().replace(/^[-*#\d\.]+\s*/, '');
    mindmap += `  root((${sanitizeLabel(rootLine || 'Central Concept')}))\n`;

    for (let i = 1; i < rawIndentedLines.length; i++) {
      const line = rawIndentedLines[i];
      const indentCount = (line.match(/^(\s+|\t+)/) || [''])[0].replace(/\t/g, '  ').length;
      const cleanLine = line.trim().replace(/^[-*#\d\.]+\s*/, '');
      if (!cleanLine) continue;

      const depth = Math.max(1, Math.min(4, Math.floor(indentCount / 2) + 1));
      const spaces = '  '.repeat(depth + 1);
      mindmap += `${spaces}${sanitizeLabel(cleanLine)}\n`;
    }

    return {
      chartCode: mindmap.trim(),
      detectedType: 'mindmap',
      explanation: `Generated Hierarchical Mindmap from indented list.`
    };
  }

  // Pattern 4: State Transitions (e.g. "from Draft to Review, then to Published")
  const stateWords = ['draft', 'review', 'pending', 'active', 'inactive', 'approved', 'rejected', 'complete', 'archived'];
  const hasStateKeywords = stateWords.filter((w) => text.toLowerCase().includes(w));
  if (hasStateKeywords.length >= 2) {
    let stateCode = 'stateDiagram-v2\n  [*] --> ' + capitalize(hasStateKeywords[0]) + '\n';
    for (let i = 0; i < hasStateKeywords.length - 1; i++) {
      stateCode += `  ${capitalize(hasStateKeywords[i])} --> ${capitalize(hasStateKeywords[i + 1])}\n`;
    }
    stateCode += `  ${capitalize(hasStateKeywords[hasStateKeywords.length - 1])} --> [*]`;
    return {
      chartCode: stateCode.trim(),
      detectedType: 'state',
      explanation: `Generated State Machine from detected states (${hasStateKeywords.join(', ')}).`
    };
  }

  // Pattern 5: Interaction / Sequence pattern (User, Client, Server, Database, System)
  const actorKeywords = ['user', 'client', 'server', 'database', 'api', 'browser', 'service', 'app'];
  const foundActors = Array.from(new Set(actorKeywords.filter((a) => text.toLowerCase().includes(a))));
  if (foundActors.length >= 2) {
    let seq = 'sequenceDiagram\n  autonumber\n';
    foundActors.forEach((a) => {
      seq += `  actor ${capitalize(a)}\n`;
    });

    const actionPhrases = lines.slice(0, 5);
    if (actionPhrases.length > 0) {
      for (let i = 0; i < actionPhrases.length; i++) {
        const actor1 = capitalize(foundActors[i % foundActors.length]);
        const actor2 = capitalize(foundActors[(i + 1) % foundActors.length]);
        const msg = sanitizeLabel(actionPhrases[i].slice(0, 45));
        seq += `  ${actor1}->>${actor2}: ${msg}\n`;
      }
    } else {
      seq += `  ${capitalize(foundActors[0])}->>${capitalize(foundActors[1])}: Request Action\n`;
      seq += `  ${capitalize(foundActors[1])}-->>${capitalize(foundActors[0])}: Return Response\n`;
    }

    return {
      chartCode: seq.trim(),
      detectedType: 'sequence',
      explanation: `Generated Sequence Diagram with participants: ${foundActors.map(capitalize).join(', ')}.`
    };
  }

  // Fallback: Smart Concept Flowchart based on bullet points or key sentences
  let flowchart = 'graph TD\n';
  const nodes = lines.slice(0, 6).map((l, idx) => ({
    id: `Item${idx + 1}`,
    label: sanitizeLabel(l.slice(0, 60))
  }));

  if (nodes.length === 1) {
    flowchart += `  A(["${nodes[0].label}"]) --> B["Action / Analysis"] --> C(["Result / Conclusion"])`;
  } else {
    for (let i = 0; i < nodes.length; i++) {
      flowchart += `  ${nodes[i].id}["${nodes[i].label}"]\n`;
      if (i > 0) {
        flowchart += `  ${nodes[i - 1].id} --> ${nodes[i].id}\n`;
      }
    }
  }

  return {
    chartCode: flowchart.trim(),
    detectedType: 'flowchart',
    explanation: 'Generated Flowchart from sentences.'
  };
}

function sanitizeLabel(str: string): string {
  return str
    .replace(/["'\[\]\(\)\{\}\<\>]/g, '')
    .trim()
    .slice(0, 70);
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
