"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "./AdminDashboard.module.css";

type ReportStatus = "Awaiting" | "Reported" | "Processing" | "Resolved";

interface DashboardCounts {
  awaiting: number;
  reported: number;
  processing: number;
  resolved: number;
}

interface IssueTypeVolume {
  type: string;
  count: number;
}

interface LocationVolume {
  location: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    awaiting: 12,
    reported: 134,
    processing: 28,
    resolved: 412,
  });

  const [issueTypes, setIssueTypes] = useState<IssueTypeVolume[]>([
    { type: "Pothole", count: 120 },
    { type: "Streetlight", count: 90 },
    { type: "Garbage", count: 80 },
    { type: "Flooding", count: 56 },
  ]);

  const [locations, setLocations] = useState<LocationVolume[]>([
    { location: "Brgy. A", count: 140 },
    { location: "Brgy. B", count: 110 },
    { location: "Brgy. C", count: 90 },
    { location: "Brgy. D", count: 50 },
  ]);

  const [avgResolutionHours, setAvgResolutionHours] = useState<number>(48.3);

  // Simulate live updates or fetches for dashboard widgets
  useEffect(() => {
    // no network calls here; this hook can be replaced with real data fetching
    const t = setInterval(() => {
      // small mock update to show dynamic feel
      setCounts((c) => ({ ...c, awaiting: Math.max(0, c.awaiting + (Math.random() > 0.7 ? 1 : 0)) }));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Derived: top problematic area (location with highest count)
  const topProblematic = useMemo(() => {
    if (!locations || locations.length === 0) return { location: "N/A", count: 0 };
    const top = locations.reduce((prev, curr) => (curr.count > prev.count ? curr : prev));
    return top;
  }, [locations]);

  // Simple sparkline SVG generator for small inline charts
  const sparklinePath = (values: number[], width = 220, height = 60) => {
    if (!values || values.length === 0) return "";
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(1, max - min);
    const step = width / Math.max(1, values.length - 1);
    return values
      .map((v, i) => {
        const x = Math.round(i * step);
        const y = Math.round(height - ((v - min) / range) * height);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Small bar-series generator for type/location charts using inline SVG bars
  const maxTypeCount = Math.max(...issueTypes.map((i) => i.count), 1);
  const maxLocCount = Math.max(...locations.map((i) => i.count), 1);

  return (
    <>
      <Head>
        <title>FixIt PH - Admin Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
        <script src="https://kit.fontawesome.com/830b39c5c0.js" crossOrigin="anonymous" defer></script>
      </Head>

      <div className={styles.adminRoot}>
        <header className={styles.header}>
          <nav className={styles.adminNav}>
            <div className={styles.navLeft}>
              <Image src="/images/Fix-it_logo_3.png" alt="Fixit Logo" className={styles.logo} width={160} height={40} />
            </div>

            <ul className={styles.navList}>
              <li className={styles.activeNavItem}>
                <a href="/admin-dashboard" className={styles.navLink}>Dashboard</a>
              </li>
              <li>
                <a href="/admin-map" className={styles.navLink}>Map</a>
              </li>
              <li>
                <a href="/admin-reports" className={styles.navLink}>Reports</a>
              </li>
              <li>
                <a href="/admin-profile" className={styles.navLink}>
                  <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Admin Profile" className={styles.adminProfilePic} />
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <main className={styles.dashboardMain}>
          <div className={styles.grid}>
            <section className={styles.statsCardRow} aria-label="Key metrics">
              <article className={`${styles.metricCard} ${styles.awaiting}`}>
                <div className={styles.metricHeader}>
                  <h4>Awaiting Approval</h4>
                  <span className={styles.metricSub}>Reports needing review</span>
                </div>
                <div className={styles.metricValue}>{counts.awaiting}</div>
              </article>

              <article className={`${styles.metricCard} ${styles.reported}`}>
                <div className={styles.metricHeader}>
                  <h4>Reported</h4>
                  <span className={styles.metricSub}>New reports</span>
                </div>
                <div className={styles.metricValue}>{counts.reported}</div>
              </article>

              <article className={`${styles.metricCard} ${styles.processing}`}>
                <div className={styles.metricHeader}>
                  <h4>Processing</h4>
                  <span className={styles.metricSub}>In-progress</span>
                </div>
                <div className={styles.metricValue}>{counts.processing}</div>
              </article>

              <article className={`${styles.metricCard} ${styles.resolved}`}>
                <div className={styles.metricHeader}>
                  <h4>Resolved</h4>
                  <span className={styles.metricSub}>Closed this month</span>
                </div>
                <div className={styles.metricValue}>{counts.resolved}</div>
              </article>
            </section>

            <section className={styles.largeCard} aria-label="Most problematic area and sparkline">
              <div className={styles.cardHeader}>
                <h3>Most Problematic Area</h3>
                <span className={styles.cardSub}>Area with highest issue volume</span>
              </div>

              <div className={styles.cardBodyRow}>
                <div className={styles.areaSummary}>
                  <div className={styles.areaName}>{topProblematic.location}</div>
                  <div className={styles.areaCount}>{topProblematic.count} issues</div>
                  <div className={styles.areaTrend}>
                    <svg width="220" height="60" viewBox="0 0 220 60" className={styles.sparkSvg} aria-hidden="true">
                      <path d={sparklinePath([10, 12, 15, 18, 16, 20, 22, 18, 25, topProblematic.count], 220, 60)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.largeCard} aria-label="Volume of issues">
              <div className={styles.cardHeader}>
                <h3>Volume of Issues</h3>
                <span className={styles.cardSub}>By Type and Location</span>
              </div>

              <div className={styles.cardBodyRow}>
                <div className={styles.chartPanel}>
                  <h4 className={styles.chartTitle}>By Type</h4>
                  <svg viewBox={`0 0 360 140`} className={styles.barChart} role="img" aria-label="Issues by type">
                    {issueTypes.map((t, i) => {
                      const barMaxHeight = 100;
                      const h = Math.round((t.count / maxTypeCount) * barMaxHeight);
                      const x = 20 + i * 80;
                      const y = 120 - h;
                      return (
                        <g key={t.type} className={styles.barGroup}>
                          <rect x={x} y={y} width={36} height={h} rx={6} fill="#2563eb" />
                          <text x={x + 18} y={136} textAnchor="middle" className={styles.barLabel}>{t.type}</text>
                          <text x={x + 18} y={y - 6} textAnchor="middle" className={styles.barValue}>{t.count}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className={styles.chartPanel}>
                  <h4 className={styles.chartTitle}>By Location</h4>
                  <svg viewBox={`0 0 360 140`} className={styles.barChart} role="img" aria-label="Issues by location">
                    {locations.map((l, i) => {
                      const barMaxHeight = 100;
                      const h = Math.round((l.count / maxLocCount) * barMaxHeight);
                      const x = 20 + i * 80;
                      const y = 120 - h;
                      return (
                        <g key={l.location}>
                          <rect x={x} y={y} width={36} height={h} rx={6} fill="#06b6d4" />
                          <text x={x + 18} y={136} textAnchor="middle" className={styles.barLabel}>{l.location}</text>
                          <text x={x + 18} y={y - 6} textAnchor="middle" className={styles.barValue}>{l.count}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </section>

            <section className={styles.largeCard} aria-label="Average resolution time and other insights">
              <div className={styles.cardHeader}>
                <h3>Average Resolution Time</h3>
                <span className={styles.cardSub}>Rolling average in hours</span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.resolutionOverview}>
                  <div className={styles.resolutionStat}>
                    <div className={styles.resolutionValue}>{Math.round(avgResolutionHours)}h</div>
                    <div className={styles.resolutionLabel}>Average</div>
                  </div>

                  <div className={styles.resolutionTrend}>
                    <svg viewBox="0 0 560 120" className={styles.lineChart} role="img" aria-label="Average resolution time trend">
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        points="10,80 90,60 170,50 250,45 330,60 410,40 490,55 540,35"
                      />
                    </svg>
                    <div className={styles.resolutionNotes}>
                      <div><strong>Tips</strong>: Prioritize high-volume locations and types for faster impact.</div>
                      <div><strong>Suggested action</strong>: Create a fast-response team for top 3 barangays.</div>
                    </div>
                  </div>
                </div>

                <hr className={styles.rule} />

                <div className={styles.additionalWidgets}>
                  <div className={styles.smallWidget}>
                    <h5>Open Tickets (30d)</h5>
                    <div className={styles.widgetNumber}>{counts.reported + counts.processing}</div>
                  </div>

                  <div className={styles.smallWidget}>
                    <h5>Avg. Time to Acknowledge</h5>
                    <div className={styles.widgetNumber}>2.4h</div>
                  </div>

                  <div className={styles.smallWidget}>
                    <h5>Tickets Closed (30d)</h5>
                    <div className={styles.widgetNumber}>{counts.resolved}</div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
