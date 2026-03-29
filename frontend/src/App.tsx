import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { TodoPage } from './pages/TodoPage';
import { GithubToolsPage } from './pages/GithubToolsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/todo" replace />} />
          <Route path="todo" element={<TodoPage />} />
          <Route path="github-tools" element={<GithubToolsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
