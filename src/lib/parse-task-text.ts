export interface ParsedTask {
  title: string
  description?: string | null
  expectedOutput?: string | null
}

function normalizeTaskLine(line: string) {
  const trimmed = line.trim()
  return trimmed.replace(/^([-*•]|\d+[\.|\)])\s*/u, '').trim()
}

export function parseTaskText(taskText: string): ParsedTask[] {
  if (!taskText || !taskText.trim()) {
    return []
  }

  const lines = taskText
    .split(/\r?\n/)
    .map((line) => normalizeTaskLine(line))
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return []
  }

  if (lines.length === 1) {
    const fullText = lines[0]
    if (fullText.length <= 80) {
      return [{ title: fullText }]
    }

    return [
      {
        title: fullText.slice(0, 80).trim(),
        description: fullText
      }
    ]
  }

  return lines.map((line) => ({ title: line }))
}
