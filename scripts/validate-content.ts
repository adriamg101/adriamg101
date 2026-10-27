// Dynamic import so a validation error thrown while content.ts parses the JSON
// is caught here and printed cleanly instead of as a stack trace.
try {
  const { content, missingTranslations } = await import('../src/lib/content')
  const { emptyKeyTags, unusedOverrideKeys } = await import('../src/lib/skills')
  for (const line of missingTranslations(content)) console.log(`warning: ${line}`)
  for (const k of unusedOverrideKeys(content.sections, content.skillOverrides))
    console.log(`warning: skills.json override "${k}" matches no tag in any entry`)
  for (const t of emptyKeyTags(content.sections))
    console.log(`warning: tag ${t} has no Latin letters or digits and is ignored as a skill`)
  console.log(`content ok (${content.sections.map((s) => `${s.key}: ${s.entries.length}`).join(', ')})`)
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
}
