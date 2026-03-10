import React from "react";
import Routes from "./Routes";
import { CompanyLocationProvider } from "./contexts/CompanyLocationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PermissionsProvider>
          <CompanyLocationProvider>
            <Routes />
          </CompanyLocationProvider>
        </PermissionsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
