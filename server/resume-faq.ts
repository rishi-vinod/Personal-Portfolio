// Public professional summaries checked against the local résumé on 2026-10-28.
// Keep personal contact information and the original PDF out of this file.
const topics = [
  {
    id: 'hardware', title: 'Bare-metal hardware project', question: 'What hardware has Rishi worked on?',
    match: /\b(hardware|gpio|bare[ -]metal|raspberry|assembly|embedded|registers?)\b/i,
    answer: 'Rishi built a bare-metal GPIO program on a Raspberry Pi 5 using C and ARM assembly, without an underlying operating system. He wrote linker scripts and startup routines for memory mapping and vector tables, and worked directly with system registers for I/O and clock controls (June–August 2026).',
    links: [{ label: 'View GPIO project', url: 'https://github.com/rishi-vinod/pi5-bare-metal-gpio' }],
  },
  {
    id: 'eve', title: 'EVE voice assistant', question: 'What is EVE?',
    match: /\b(eve|voice|speech|whisper|assistant)\b/i,
    answer: 'In June 2026, Rishi collaborated with a peer on EVE, a voice-activated assistant with speech recognition, LLM integration, and text-to-speech. He contributed to the speech pipeline using faster-whisper and resolved microphone sample-rate and Python environment issues.',
    links: [{ label: 'View EVE', url: 'https://github.com/rishi-vinod/EVE' }],
  },
  {
    id: 'constai', title: 'ConstAI.us scheduling app', question: 'What is ConstAI.us?',
    match: /\b(constai|scheduling|schedules?|gemini)\b/i,
    answer: 'In March 2026, Rishi collaborated with two developers on ConstAI.us, a personalized scheduling application built with React, Node.js, and Vite. He integrated the Gemini API to generate schedules from users’ goals and priorities and refined its outputs through prompt engineering.',
    links: [{ label: 'View ConstAI.us', url: 'https://github.com/rishi-vinod/ConstAI.us' }],
  },
  {
    id: 'research', title: 'Autonomous vehicle research proposal', question: 'What research has Rishi explored?',
    match: /\b(research|autonomous|vehicles?|driving|simulation)\b/i,
    answer: 'For HNRS 110: Research and Inquiry (August–December 2025), Rishi wrote an independent proposal on safer interactions between autonomous vehicles and human drivers. It examined merging, unsignalized intersections, and lane changes, proposing an edge-case simulation framework for limitations in game-theoretic decision models. The résumé describes a proposal, not a published paper or completed deployment.',
    links: [],
  },
  {
    id: 'coursework', title: 'Relevant coursework', question: 'What coursework is on the résumé?',
    match: /\b(coursework|courses?|classes|calculus|algebra|tinyml)\b/i,
    answer: 'Listed coursework includes Object-Oriented Programming I and II, Multivariable Calculus, Linear Algebra, Differential Equations, Introduction to AI (Coursera), Python for Data Science, AI and Development (Coursera), and Fundamentals of TinyML (HarvardX).',
    links: [],
  },
  {
    id: 'leadership', title: 'Leadership and student involvement', question: 'What leadership experience does Rishi have?',
    match: /\b(leadership|treasurer|mason|ai club|events?|volunteer)\b/i,
    answer: 'Rishi served as treasurer of George Mason University’s AI Club from September 2025 to May 2026. He helped facilitate an AI partnership event with industry panelists for more than 150 members and coordinated weekly logistics, communications, and partnerships with campus organizations and technology groups.',
    links: [],
  },
  {
    id: 'appdev', title: 'App Dev Club', question: 'What is Rishi learning in App Dev Club?',
    match: /\b(app dev|bootcamp|fastapi|mongodb|devops|clubs?)\b/i,
    answer: 'The résumé lists Rishi as a University of Maryland App Dev Club bootcamp student from September 2026. He is building full-stack web applications with React, FastAPI, and MongoDB while learning Git/GitHub workflows, DevOps, and system design.',
    links: [],
  },
  {
    id: 'education', title: 'Education', question: 'What is Rishi studying?',
    match: /\b(education|studying|studies|study|school|college|university|degree|major|graduat\w*|maryland)\b/i,
    answer: 'Rishi is pursuing a Bachelor of Science in Computer Engineering at the University of Maryland, College Park. The résumé lists May 2029 as his expected graduation date.',
    links: [],
  },
  {
    id: 'skills', title: 'Technical skills', question: 'What are Rishi’s technical skills?',
    match: /\b(skills?|languages?|tools?|technologies|tech stack|python|java|javascript|react|node|vite|cad|onshape|programming)\b/i,
    answer: 'The skills section lists C, Python, and Java; React, Node.js, Vite, Makefile, and GitHub; and Onshape CAD design. His project experience also includes ARM assembly, JavaScript, speech processing, and API integration.',
    links: [],
  },
  {
    id: 'projects', title: 'Project experience', question: 'What projects has Rishi built?',
    match: /\b(projects?|built|building|experience|background|portfolio|about|software)\b/i,
    answer: 'The résumé features a bare-metal Raspberry Pi 5 GPIO project, EVE (a collaborative voice assistant), ConstAI.us (a collaborative scheduling app), and an independent autonomous-vehicle research proposal. Ask about any of those for more detail.',
    links: [],
  },
]

export const faqSuggestions = ['education', 'skills', 'projects', 'leadership'].map((id) => topics.find((topic) => topic.id === id)!.question)

export function answerResumeQuestion(question: string) {
  const normalized = question.normalize('NFKC')
  const notListed = /\b(gpa|salary|pay|paid|address|phone|email|visa|citizenship|age|birthday|available|availability|hire|hiring|internships?|employment|references?|password|secret)\b/i.test(normalized)
  const topic = notListed ? undefined : topics.find(({ match }) => match.test(normalized))
  if (!topic) return {
    matched: false, title: 'Let’s ask Rishi',
    answer: 'That detail isn’t covered by these résumé FAQs. You can ask about education, technical skills, projects, or leadership—or send Rishi a message for a personal answer.',
    links: [],
  }
  return { matched: true, title: topic.title, answer: topic.answer, links: topic.links }
}
