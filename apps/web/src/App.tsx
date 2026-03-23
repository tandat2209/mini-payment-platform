import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import type { JSX } from 'react';

import { DashboardShell } from './components/dashboard/dashboard-shell';
import type { AppPage } from './components/dashboard/utils';
import { type ActiveSection, useDashboardStore } from './store/dashboard-store';

function App(): JSX.Element {
  const navigate = useNavigate();
  const activeSection = useDashboardStore((state) => state.activeSection);
  const setActiveSection = useDashboardStore((state) => state.setActiveSection);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const currentPage: AppPage = pathname === '/add-money' ? 'add-money' : 'dashboard';

  function scrollToSection(section: ActiveSection): void {
    const sectionId = `section-${section.toLowerCase()}`;

    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        globalThis.document?.getElementById(sectionId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  }

  function handleSectionSelect(section: ActiveSection): void {
    setActiveSection(section);

    if (currentPage !== 'dashboard') {
      void navigate({ to: '/' }).then(() => {
        scrollToSection(section);
      });
      return;
    }

    scrollToSection(section);
  }

  return (
    <DashboardShell
      activeSection={activeSection}
      currentPage={currentPage}
      onSectionSelect={handleSectionSelect}
    >
      <Outlet />
    </DashboardShell>
  );
}

export default App;
