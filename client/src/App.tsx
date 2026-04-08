import { Navigate, Route, Routes } from "react-router";

import { ProtectionRount } from "./components/ProtectionRount";
import { Homepage } from "./pages/Homepage";
import { LoginPages } from "./pages/LoginPages";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPages />} />
      <Route path="/" element={<ProtectionRount />}>
        <Route index element={<Homepage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
