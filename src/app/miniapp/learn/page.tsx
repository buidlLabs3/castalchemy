'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from '../page.module.css';
import {
  getEducationLesson,
  getEducationLessons,
  getNextEducationStep,
  getPreviousEducationStep,
} from '@/lib/education/lessons';

export default function LearnPage() {
  const [lessonStep, setLessonStep] = useState(1);
  const lessons = getEducationLessons();
  const activeLesson = getEducationLesson(lessonStep);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Protocol guide</span>
                <span className={styles.networkBadge}>Alchemix V3</span>
              </div>
              <h1 className={styles.heroTitle}>Learn before you borrow</h1>
              <p className={styles.heroSubtitle}>
                A compact V3 education path that mirrors the current Alchemix docs: MYT,
                tokenId positions, redemptions, and risk buffers.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Navigation</span>
              <Link href="/miniapp" className={styles.secondaryButton}>
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className={styles.gridTwoWide}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Learning path</p>
                <h2 className={styles.panelTitle}>
                  Lesson {activeLesson.step} of {activeLesson.totalSteps}
                </h2>
              </div>
              <a
                className={styles.textLink}
                href={`/api/education?step=${activeLesson.step}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                API
              </a>
            </div>

            <div className={styles.lessonCard}>
              <span className={styles.infoLabel}>Core concept</span>
              <strong>{activeLesson.title}</strong>
              <p>{activeLesson.summary}</p>
              <ul className={styles.bulletList}>
                {activeLesson.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className={styles.dualActionRow}>
                <button
                  className={styles.secondaryButton}
                  onClick={() => setLessonStep(getPreviousEducationStep(activeLesson.step))}
                  disabled={activeLesson.step === 1}
                >
                  Previous
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() =>
                    setLessonStep(
                      activeLesson.step === activeLesson.totalSteps
                        ? 1
                        : getNextEducationStep(activeLesson.step),
                    )
                  }
                >
                  {activeLesson.step === activeLesson.totalSteps ? 'Restart' : 'Next'}
                </button>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Index</p>
                <h2 className={styles.panelTitle}>All lessons</h2>
              </div>
            </div>

            <div className={styles.stackCompact}>
              {lessons.map((lesson) => (
                <button
                  key={lesson.step}
                  className={`${styles.listCard} ${lesson.step === activeLesson.step ? styles.v3ActionCardActive : ''}`}
                  onClick={() => setLessonStep(lesson.step)}
                >
                  <span className={styles.infoLabel}>Step {lesson.step}</span>
                  <strong>{lesson.title}</strong>
                  <span className={styles.cardNote}>{lesson.summary}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
