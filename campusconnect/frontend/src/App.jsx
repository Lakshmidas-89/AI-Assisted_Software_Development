import { Route, Routes } from "react-router-dom";

import { CompassIcon } from "./components/Icons.jsx";
import Layout from "./components/Layout.jsx";
import { ButtonLink, EmptyState } from "./components/ui.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import HomePage from "./pages/HomePage.jsx";

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-16">
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you were looking for does not exist or has moved."
        action={<ButtonLink to="/">Back to overview</ButtonLink>}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
