import test from 'node:test'
import assert from 'node:assert/strict'
import { getCurriculumRegistry } from '../curriculum/registry'

const requiredAreas = [
  'Software Engineering',
  'Artificial Intelligence',
  'Data Science',
  'Cyber Security',
  'Cloud Computing',
  'Networking',
  'DevOps',
  'Mobile Development',
  'Web Development',
  'UI/UX Design',
  'Game Development',
  'Embedded Systems',
  'Business Analysis',
  'Project Management',
  'Digital Marketing',
  'Graphic Design',
  'Computer Support & IT',
  'Data Engineering',
  'Machine Learning',
  'Quality Assurance',
]

test('default curriculum registry includes the BGHUB foundation areas and realistic competency trees', () => {
  const registry = getCurriculumRegistry()
  const names = registry.map((entry) => entry.learningArea.name)

  for (const area of requiredAreas) {
    assert.ok(names.includes(area), `Missing required learning area: ${area}`)
  }

  assert.ok(registry.length >= requiredAreas.length)
  assert.ok(registry.every((entry) => entry.competencies.length >= 3), 'Each learning area must include multiple competencies')
  assert.ok(registry.every((entry) => entry.competencies.some((competency) => competency.groups.length >= 2)), 'Each competency tree should include competency groups')
})
