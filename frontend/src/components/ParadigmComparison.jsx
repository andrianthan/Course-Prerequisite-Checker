/**
 * ParadigmComparison — calls both OOP and FP backends simultaneously,
 * shows verdicts side by side with paradigm explanations and source code.
 */
import React, { useEffect, useState } from 'react'
import { checkEligibility } from '../api.js'

const PARADIGMS = [
  {
    key: 'oop',
    label: 'OOP',
    color: 'indigo',
    how: "Rule objects (AndRule, OrRule, CourseRule) form a tree. check() dispatches to each object's evaluate() method — behavior lives in the class hierarchy.",
  },
  {
    key: 'fp',
    label: 'FP',
    color: 'violet',
    how: 'Pure functions recursively pattern-match the rule type (eval_rule). No mutable state — same input always produces the same output.',
  },
]

const OOP_SOURCE = `class Rule:
    def evaluate(self, completed, in_progress, catalog):
        raise NotImplementedError()

class AndRule(Rule):
    def __init__(self, requirements):
        self.requirements = list(requirements)

    def evaluate(self, completed, in_progress, catalog):
        unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(
                completed, in_progress, catalog
            )
            if not ok:
                unmet.extend(msgs)
        return len(unmet) == 0, unmet

class OrRule(Rule):
    def evaluate(self, completed, in_progress, catalog):
        all_unmet = []
        for req in self.requirements:
            ok, msgs = req.evaluate(
                completed, in_progress, catalog
            )
            if ok:
                return True, []
            all_unmet.extend(msgs)
        return False, [" OR ".join(all_unmet)]`

const FP_SOURCE = `# Frozen dataclasses — immutable by design
@dataclass(frozen=True)
class AndRule:
    requirements: tuple

@dataclass(frozen=True)
class OrRule:
    requirements: tuple

def evaluate_rule(rule, completed, in_progress, catalog):
    match rule:
        case None:
            return True, []
        case CourseRule(course_id=cid, min_grade=mg):
            earned = completed.get(cid)
            if earned is None:
                return False, [f"missing {cid}"]
            if not grade_meets_minimum(earned, mg or "C-"):
                return False, [f"needs {cid} >= {mg}"]
            return True, []
        case AndRule(requirements=reqs):
            unmet = []
            for r in reqs:
                ok, msgs = evaluate_rule(
                    r, completed, in_progress, catalog
                )
                if not ok:
                    unmet.extend(msgs)
            return len(unmet) == 0, unmet
        case OrRule(requirements=reqs):
            for r in reqs:
                ok, _ = evaluate_rule(
                    r, completed, in_progress, catalog
                )
                if ok:
                    return True, []
            return False, ["no branch satisfied"]`

function SingleVerdict({ paradigm, courseId, record }) {
  const [verdict, setVerdict] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId || !record) { setVerdict(null); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    checkEligibility(courseId, record.completed, record.in_progress, paradigm.key)
      .then(v => { if (!cancelled) setVerdict(v) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, record, paradigm.key])

  const accentText = paradigm.color === 'indigo' ? 'text-indigo-600' : 'text-violet-600'
  const accentBorder = paradigm.color === 'indigo' ? 'border-indigo-200' : 'border-violet-200'
  const accentBg = paradigm.color === 'indigo' ? 'bg-indigo-50' : 'bg-violet-50'

  return (
    <div className={`flex-1 rounded-lg border ${accentBorder} shadow-sm overflow-hidden`}>
      <div className={`${accentBg} border-b ${accentBorder} px-4 py-2 flex items-center gap-2`}>
        <span className={`font-bold text-sm ${accentText}`}>{paradigm.label}</span>
        <span className="text-xs text-gray-500">backend</span>
      </div>
      <div className="p-4 bg-white">
        {!courseId && <p className="text-sm text-gray-400">Pick a course above.</p>}
        {courseId && loading && <p className="text-sm text-gray-500">Checking…</p>}
        {courseId && error && <p className="text-sm text-red-600">Error: {error}</p>}
        {courseId && !loading && !error && verdict && (
          <>
            <div className={`text-xs font-bold uppercase tracking-wide ${verdict.eligible ? 'text-green-700' : 'text-red-700'}`}>
              {verdict.eligible ? '✓ Eligible' : '✗ Not eligible'}
            </div>
            <div className="mt-1 font-mono text-base font-semibold text-gray-900">{courseId}</div>
            <div className={`mt-2 text-sm leading-relaxed ${verdict.eligible ? 'text-green-900' : 'text-red-900'}`}>
              {verdict.explanation}
            </div>
          </>
        )}
      </div>
      <div className={`border-t ${accentBorder} px-4 py-3 ${accentBg}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">How it works</p>
        <p className="text-xs text-gray-600 leading-relaxed">{paradigm.how}</p>
      </div>
    </div>
  )
}

function SourceDrawer({ onClose }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
        <span className="text-xs font-semibold uppercase tracking-wide">Paradigm Source Code</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕ Close</button>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-700 bg-gray-950">
        <div>
          <div className="px-4 py-2 bg-indigo-900 text-indigo-200 text-xs font-bold uppercase tracking-wide">
            OOP — src/oop/models.py
          </div>
          <pre className="p-4 text-xs text-green-300 overflow-auto max-h-80 leading-relaxed font-mono whitespace-pre">{OOP_SOURCE}</pre>
        </div>
        <div>
          <div className="px-4 py-2 bg-violet-900 text-violet-200 text-xs font-bold uppercase tracking-wide">
            FP — src/fp/checker.py
          </div>
          <pre className="p-4 text-xs text-green-300 overflow-auto max-h-80 leading-relaxed font-mono whitespace-pre">{FP_SOURCE}</pre>
        </div>
      </div>
      <div className="px-4 py-2 bg-gray-800 text-xs text-gray-400">
        Key difference: OOP behavior lives in each class's <code className="text-yellow-300">evaluate()</code> method. FP behavior is one pure function using Python 3.10 <code className="text-yellow-300">match/case</code> structural pattern matching.
      </div>
    </div>
  )
}

export default function ParadigmComparison({ courseId, record }) {
  const [showSource, setShowSource] = useState(false)

  return (
    <div>
      <div className="flex gap-4">
        {PARADIGMS.map(p => (
          <SingleVerdict key={p.key} paradigm={p} courseId={courseId} record={record} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {courseId ? (
          <p className="text-xs text-gray-400">
            Both backends evaluate the same prerequisite rules — identical results demonstrate paradigm parity.
          </p>
        ) : <span />}
        <button
          onClick={() => setShowSource(s => !s)}
          className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50 transition-colors ml-auto"
        >
          {showSource ? 'Hide source' : '⟨/⟩ View source'}
        </button>
      </div>
      {showSource && <SourceDrawer onClose={() => setShowSource(false)} />}
    </div>
  )
}
