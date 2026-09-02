export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'daily',
    name: 'Daily Standup & Priorities',
    description: 'Track daily top 3 priorities, tasks, and notes',
    icon: 'calendar',
    content: `# 📅 Daily Focus — ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

### 🎯 Top 3 Priorities for Today
- [ ] 1. 
- [ ] 2. 
- [ ] 3. 

### ⚡ Quick Tasks & Checklists
- [ ] Morning standup & team check-in
- [ ] Deep work block (90 mins)
- [ ] Review PRs & documentation

### 📝 Notes & Observations
> [!NOTE]
> Capture transient thoughts, decisions, and meeting takeaways here.

- 

### 🌿 End of Day Reflections
- **Wins**: 
- **Blockers / To carry forward**: `
  },
  {
    id: 'meeting',
    name: 'Meeting Minutes & Action Items',
    description: 'Capture attendees, key decisions, and assigned actions',
    icon: 'users',
    content: `# 🤝 Meeting: [Topic / Project Name]
**Date**: ${new Date().toLocaleDateString()} | **Attendees**: @You, @Colleague

### 🎯 Agenda & Objectives
1. Review current project milestones
2. Unblock technical architecture decisions
3. Finalize sprint deliverables

### 💡 Key Discussions & Decisions
- Decision 1: 
- Decision 2: 

### 🚀 Action Items & Next Steps
| Task | Assignee | Due Date | Status |
| :--- | :--- | :--- | :--- |
| Complete technical spec | @You | Friday | In Progress |
| Review PR & deployment | @Dev | Monday | Pending |

> [!TIP]
> Keep action items atomic and assigned to a single person.`
  },
  {
    id: 'spec',
    name: 'Product & Architecture Spec',
    description: 'Structure system design, APIs, and milestones',
    icon: 'cpu',
    content: `# 📐 Architecture Spec: [Feature / System Name]

## 1. Problem Statement & Goals
- **Problem**: 
- **Target Outcome**: 

## 2. Technical Architecture
\`\`\`typescript
interface SystemContract {
  id: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
\`\`\`

## 3. Implementation Phases
- [ ] Phase 1: Database schemas & IndexedDB migrations
- [ ] Phase 2: UI Components & responsive views
- [ ] Phase 3: Integration tests & performance benchmarks

> [!WARNING]
> Ensure zero regression in offline mode and responsive layout for Mac/iOS.`
  },
  {
    id: 'weekly',
    name: 'Weekly Review & Planning',
    description: 'Synthesize accomplishments and outline next sprint',
    icon: 'trending-up',
    content: `# 📊 Weekly Review — Week of ${new Date().toLocaleDateString()}

### 🏆 Major Wins & Shipped Features
- 

### 🔍 Key Metrics & Performance
- Total notes created:
- Projects unblocked:

### 🔭 Next Week Focus
- [ ] Priority Initiative A
- [ ] Priority Initiative B`
  },
  {
    id: 'cornell',
    name: 'Cornell Learning Notes',
    description: 'Effective study and conceptual retention framework',
    icon: 'book-open',
    content: `# 📚 Topic: [Course or Subject Name]

| Cues & Questions | Notes & Detailed Explanations |
| :--- | :--- |
| Core concept? | Details and definition here |
| Why does this matter? | Real world applications |
| Key formula / rule? | Formulas and syntax examples |

## Summary
> Write a 2-3 sentence summary of the main ideas learned above.`
  }
];
