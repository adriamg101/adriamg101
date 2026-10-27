import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AnimationProvider } from './components/AnimationProvider'
import { BackToTop } from './components/BackToTop'
import { ScrollToTop } from './components/ScrollToTop'
import { SkillPanelProvider } from './components/SkillPanel'
import { TopBar } from './components/TopBar'
import { content } from './lib/content'
import { SettingsProvider } from './lib/settings'
import { shuffle } from './lib/shuffle'
import { collectSkills, type Skill } from './lib/skills'
import { DetailView } from './pages/DetailView'
import { HomePage } from './pages/HomePage'
import { SectionView } from './pages/SectionView'
import { SkillsView } from './pages/SkillsView'

function SectionRoute() {
  const { section: key } = useParams()
  const section = content.sections.find((s) => s.key === key)
  if (!section || section.entries.length === 0) return <Navigate to="/" replace />
  return (
    <AnimationProvider key={section.key} pageId={section.key}>
      <SectionView about={content.about} section={section} />
    </AnimationProvider>
  )
}

function DetailRoute() {
  const { section: key, entryId } = useParams()
  const section = content.sections.find((s) => s.key === key)
  if (!section || section.entries.length === 0) return <Navigate to="/" replace />
  const entry = section.entries.find((e) => e.id === entryId)
  if (!entry) return <Navigate to={`/${section.key}`} replace />
  // one shared animation flag for every detail view; the key still remounts the view per entry
  return (
    <AnimationProvider key={`${section.key}/${entry.id}`} pageId="detail">
      <DetailView about={content.about} section={section} entry={entry} />
    </AnimationProvider>
  )
}

function AppRoutes({ skills }: { skills: Skill[] }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AnimationProvider key="home" pageId="home">
            <HomePage about={content.about} skills={skills} sections={content.sections} />
          </AnimationProvider>
        }
      />
      <Route
        path="/skills"
        element={
          skills.length > 0 ? (
            <AnimationProvider key="skills" pageId="skills">
              <SkillsView about={content.about} skills={skills} />
            </AnimationProvider>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/:section" element={<SectionRoute />} />
      <Route path="/:section/:entryId" element={<DetailRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const [skills] = useState(() => shuffle(collectSkills(content.sections, content.skillOverrides)))
  return (
    <SettingsProvider>
      <HashRouter>
        <SkillPanelProvider sections={content.sections} skills={skills}>
          <ScrollToTop />
          <TopBar sections={content.sections} hasSkills={skills.length > 0} />
          <main tabIndex={-1}>
            <AppRoutes skills={skills} />
          </main>
          <BackToTop />
        </SkillPanelProvider>
      </HashRouter>
    </SettingsProvider>
  )
}
