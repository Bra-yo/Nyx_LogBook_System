export interface ParsedTask {
  title: string
  description?: string | null
  expectedOutput?: string | null
}

function normalizeTaskLine(line: string) {
  return line
    .trim()
    .replace(/^[-*•]\s*/u, '')
    .replace(/^\d+[.)]\s*/u, '')
    .trim()
}

export function parseTaskText(taskText: string): ParsedTask[] {
  const cleaned = taskText.trim()

  if (!cleaned) return []

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => normalizeTaskLine(line))
    .filter(Boolean)

  if (lines.length > 1) {
    return lines.map((line) => ({
      title: line.length > 120 ? line.slice(0, 120) : line,
      description: line.length > 120 ? line : null,
      expectedOutput: null
    }))
  }

  return [
    {
      title: cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned,
      description: cleaned,
      expectedOutput: null
    }
  ]
}
