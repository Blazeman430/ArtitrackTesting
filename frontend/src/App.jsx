import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import HTMInventory from "./pages/HTMinventory";
import PEInventory from "./pages/PEinventory";
import SCIInventory from "./pages/SCIinventory";
import ICTInventory from "./pages/ICTinventory";
import { CustodianDashboard } from "./pages/CustodianDashboard";
import { BorrowerHome } from "./pages/BorrowerHome";
import { BorrowerItems } from "./pages/BorrowerItems";
import { BorrowerHistory } from "./pages/BorrowerHistory";
import "./App.css";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import RedirectAuthed from "./components/RedirectAuthed";
import RequireRole from "./components/RequireRole";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RedirectAuthed><Login /></RedirectAuthed>} />
          <Route path="/loginpage" element={<RedirectAuthed><Login /></RedirectAuthed>} />

          {/* lab_faci by dept */}
          <Route
            path="/htm_labfaci"
            element={
              <RequireAuth>
                <RequireRole allow={[['lab_faci','HTM']]}>
                  <HTMInventory/>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/pe_labfaci"
            element={
              <RequireAuth>
                <RequireRole allow={[['lab_faci','PE']]}>
                  <PEInventory/>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/sci_labfaci"
            element={
              <RequireAuth>
                <RequireRole allow={[['lab_faci','SCI']]}>
                  <SCIInventory/>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/ict_labfaci"
            element={
              <RequireAuth>
                <RequireRole allow={[['lab_faci','ICT']]}>
                  <ICTInventory/>
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* custodian/admin only */}
          <Route
            path="/custodian_dashboard"
            element={
              <RequireAuth>
                <RequireRole allow={['custodian','admin']}>
                  <CustodianDashboard />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* borrower only */}
          <Route
            path="/borrower"
            element={
              <RequireAuth>
                <RequireRole allow={['borrower']}>
                  <BorrowerHome />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/borrower/items"
            element={
              <RequireAuth>
                <RequireRole allow={['borrower']}>
                  <BorrowerItems />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/borrower/items/:dept"
            element={
              <RequireAuth>
                <RequireRole allow={['borrower']}>
                  <BorrowerItems />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/borrower/history"
            element={
              <RequireAuth>
                <RequireRole allow={['borrower']}>
                  <BorrowerHistory />
                </RequireRole>
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
