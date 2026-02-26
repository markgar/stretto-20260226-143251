import { Routes, Route } from 'react-router-dom';

function HomePage() {
  return <h1>Stretto</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
