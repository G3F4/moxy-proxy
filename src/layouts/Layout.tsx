import React, { lazy, Suspense, useContext } from 'react';
import { AppStateContext } from '../App';

const Header = lazy(() => import('../modules/header/Header'));
const BoardLayout = lazy(() => import('./BoardLayout'));
const PanelLayout = lazy(() => import('./PanelLayout'));
const TabsLayout = lazy(() => import('./TabsLayout'));

export default function Layout() {
  const { viewMode } = useContext(AppStateContext);

  return (
    <>
      <Suspense fallback="Loading header...">
        <Header />
      </Suspense>
      {viewMode === 'tabs' && (
        <Suspense fallback="Loading tabs layout...">
          <TabsLayout />
        </Suspense>
      )}
      {viewMode === 'panels' && (
        <Suspense fallback="Loading panel layout...">
          <PanelLayout />
        </Suspense>
      )}
      {viewMode === 'board' && (
        <Suspense fallback="Loading board layout...">
          <BoardLayout />
        </Suspense>
      )}
    </>
  );
}
